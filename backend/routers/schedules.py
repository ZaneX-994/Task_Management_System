import numpy as np
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from typing import List, Optional, Union
from utility import oauth2_scheme, get_db_conn, verify_token


router = APIRouter()

from routers.tasks import Task

class ScheduleRequest(BaseModel):
    tasks: List[Task]
    removedTasks: List[int]
    dailyTime: int
    shortest_possible: Optional[bool] = False

@router.get("/schedule")
async def create_schedule(reschedule: bool = True,
                          removedTasks: Union[str, None] = None,
                          time: float = None,
                          shortestPossible: bool = False,
                          token: str = Depends(oauth2_scheme)):
    id = verify_token(token)
    # print(removedTasks, time, shortestPossible)

    if removedTasks is not None and removedTasks != '':
        removedTasks = [int(i) for i in removedTasks.split(',')]
    else:
        removedTasks = []

    select_task_list = """
        SELECT tasks.id, tasks.title, tasks.deadline, tasks.progress, tasks.mean, tasks.stddev
        FROM tasks               
            JOIN task_assignees ON tasks.id = task_assignees.task_id
            JOIN profiles ON task_assignees.profile_id = profiles.id
        WHERE profiles.id = %s
        ORDER BY tasks.deadline, tasks.mean;
        """
    select_task_list = """
        SELECT tasks.id, tasks.title, tasks.deadline, tasks.progress, tasks.mean, tasks.stddev, assignee_counts.assignees as assignees
        FROM tasks               
            JOIN task_assignees ON tasks.id = task_assignees.task_id
            JOIN profiles ON task_assignees.profile_id = profiles.id
            JOIN (SELECT task_id, COUNT(profile_id) AS assignees 
                  FROM task_assignees GROUP BY task_id) AS assignee_counts ON tasks.id = assignee_counts.task_id
            WHERE profiles.id = %s AND tasks.progress NOT IN ('Blocked', 'Completed')
        ORDER BY tasks.deadline, tasks.mean;
        """

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(select_task_list, (id,))
    tasks = cur.fetchall()
    # for t in sorted(tasks, key = lambda x : x[1]):
    #     print(t)
    cur.close()
    conn.close()
    column_names = [desc[0] for desc in cur.description]
    tasks_dict = {task[0]: dict(zip(column_names, task)) for task in tasks}
    # print(tasks)
    print(removedTasks)
    tasks = list(tasks_dict.values())
    print(f"Generating Schedule, given time {time} minutes, shortestPossible : {shortestPossible}, and tasks not available to do today {removedTasks}...")
    ts = TaskScheduler(tasks)
    schedule,time,failure = ts.get_schedule(reschedule, shortestPossible, time, removedTasks)
    print("Schedule Complete...")
    today = datetime.now().date().strftime('%Y-%m-%d')
    dailies = [{k: v for k, v in task.items() if k in ['title', 'deadline', 'task_id']} for task in schedule[today]]
    return {"daily_tasks": dailies, "schedule": schedule, "time": time, "failure": failure}


# Shortest list of assigned tasks
# such that if I complete that much work everyday, 
# I will meet the deadlines of all assigned tasks,


# Not Started', 'Blocked', 'Completed', 'In Progress'

progress_map = {
    'Not Started' : 1, "Blocked": 0, 'Completed' : 0, 'In Progress': 0.5
}

class TaskEntity:
    def __init__(self, id, title, progress='Not Started', deadline=None, mean = 40, stddev = 10, assignees=1):
        self.id = int(id)
        self.progress = progress_map[progress]
        self.title = title
        self.mean = mean if mean != None else 40
        self.stddev = stddev if stddev != None else 10
        self.assignees = assignees
        # self.deadline = datetime.strptime(deadline, '%Y-%m-%d') if deadline != None else None
        self.deadline = deadline

    def sample_duration(self, stochastic=True):
        if stochastic:
            base = np.random.normal(self.mean, self.stddev)
        else:
            base = self.mean
        
        # return int((base*self.progress)/self.assignees)
        # AMDAHLS LAW APPLIED TO WORKERS
        parallelizable_portion = 0.75
        speedup = 1 / ((1 - parallelizable_portion) + parallelizable_portion/self.assignees)
        new_time = base / speedup
        remaining_time = new_time * self.progress
        return int(remaining_time)

    def __repr__(self):
        return f"TASK: {self.title}, DUE: {self.deadline}, MEAN: {self.mean}, STDDEV: {self.stddev}, NO. ASSIGNEES: {self.assignees}"
    
    def get_deadline(self):
        return self.deadline.strftime('%Y-%m-%d') if self.deadline != None else ""

    def to_dict(self):
        return {
            'task_id': self.id,
            # 'progress': self.progress,
            # 'assignees': self.assignees,
            'title': self.title,
            'mean': self.mean,
            'stddev': self.stddev,
            'deadline': self.deadline
        }


class TaskScheduler:

    def __init__(self, tasks):
        self.tasks = sorted([TaskEntity(**t) for t in tasks], key=lambda task: (task.deadline is None, task.deadline))
        self.schedule = None

    def run_simulation(self, not_first_day, simulation_length=1000, success_threshold=0.95):
        print(not_first_day)
        low, high = 15, 840
        while low <= high:
            mid = (low + high) // 2
            successes = 0
            for _ in range(simulation_length):
                _, insufficient_time = self.greedy(mid, not_first_day, lambda x : x.sample_duration(stochastic=True))
                if not insufficient_time:
                    successes += 1

            success_rate = successes / simulation_length
            # print(f"Allowed Time: {mid/60} Hours, Success rate: {success_rate*100}%")

            if success_rate >= success_threshold: 
                high = mid - 1
            else:
                low = mid + 1
        # print(f"BEST TIME {mid/60} : success rate {success_rate*100}")
        return mid


    def greedy(self, allowed_time, not_first_day, sampler = lambda x : x.sample_duration()):
        completed = 0
        schedule = [[]]
        time = allowed_time
        insufficient_time = False
        
        # print(not_first_day)
        not_day_one = [task for task in self.tasks if task.id in not_first_day]
        tasks = [task for task in self.tasks if task.id not in not_first_day]

        # print(not_day_one[0:10])
        # print(tasks[0:10])

        def get_next_task():
            if len(not_day_one) > 0 and len(schedule) > 1:
                return not_day_one.pop(0)
            if len(tasks) > 0:
                return tasks.pop(0)
            return None
            
        while task := get_next_task():
            if task.deadline != None and task.deadline < (datetime.now() + timedelta(days=len(schedule)-1)).date():
                insufficient_time = True
            sampled_time = sampler(task)
            if sampled_time > allowed_time:
                time = 0
            else:
                time -= sampled_time

            if time < 0:
                # NEW DAY
                schedule.append([])
                time = allowed_time
            else:
                schedule[-1].append(task)
                completed += 1
        return (schedule, insufficient_time)

    def get_schedule(self, reschedule=True, shortest_possible=False, allowed_time=8*60, not_today=[]):
        if reschedule == True or self.schedule == None or self.schedule["date_created"] != datetime.now().date():
            return self.generate_schedule(shortest_possible, allowed_time, not_today)            
        else:
            return (self.schedule["data"], self.schedule["allowed_time"], self.schedule["failure"])

    def generate_schedule(self, shortest_possible, allowed_time, not_today):
        if shortest_possible:
            allowed_time = self.run_simulation(not_today, simulation_length=1000)
        schedule, failure = self.greedy(allowed_time, not_today)
        schedule = [[task.to_dict() for task in day_list] for day_list in schedule]
        # print(len(schedule))
        schedule_dict = {(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d'): day_list for i, day_list in enumerate(schedule)}
        # print(schedule_dict)
        self.schedule = {"date_created": datetime.now().date(), "data": schedule_dict, "allowed_time": allowed_time, "failure": failure}
        return (schedule_dict, allowed_time, failure)
