from fastapi import APIRouter, Depends, HTTPException, status
from typing import Union, List
from utility import oauth2_scheme, verify_token, get_db_conn
from pydantic import BaseModel
from datetime import datetime
import numpy as np

class User_profile(BaseModel):
    u_id: int
    email: str
    first_name: str
    last_name: str
    image: Union[str, None]
class Task(BaseModel):
    title: str
    assignees: Union[List[User_profile], None]
    description: Union[str, None] 
    deadline: Union[str, None]
    mean: Union[str, None]
    stddev: Union[str, None]

class Edit_Task(BaseModel):
    task_id: int
    progress: Union[str, None]
    assignees: Union[List[User_profile], None]
    title: Union[str, None]
    description: Union[str, None]
    deadline: Union[str, None]
    mean: Union[str, None]
    stddev: Union[str, None]

router = APIRouter()

# create tasks with details given
@router.post("/task")
async def create_task(task: Task, token: str = Depends(oauth2_scheme)):
    creator_id = verify_token(token)
    
    title = task.title
    assignees = task.assignees
    description = task.description
    deadline = task.deadline
    progress = "Not Started"
    mean = task.mean
    stddev = task.stddev
    initial_time = str(datetime.now().date())
    
    conn = get_db_conn()
    cur = conn.cursor()
    
    # Insert the new task.
    insert_task_sql = """
        INSERT INTO tasks (title, creator_id, deadline, description, initial_date, progress, mean, stddev)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """
    cur.execute(insert_task_sql, (title, creator_id, deadline, description, initial_time, progress, mean, stddev))
    
    task_id = cur.fetchone()[0]
    
    # Insert the creator for the new task.
    insert_assignees_sql = """
        INSERT INTO task_assignees (task_id, profile_id)
        VALUES (%s, %s)
    """

    if assignees is not None:
        for assignee in assignees:
            u_id = assignee.u_id
            cur.execute(insert_assignees_sql, (task_id, u_id))
            
    conn.commit()
    
    cur.close()
    conn.close()
    

    return {"task_id": task_id}

# edit task with changes given
@router.put("/edit_task")
async def edit_task(
    edit: Edit_Task, token: str = Depends(oauth2_scheme)
):  
    verify_token(token)
    request = []
    task_id = edit.task_id
    assignees = edit.assignees
    
    args = []
    
    if edit.progress is not None:
        request.append(('progress', edit.progress))  
    if edit.title is not None:
        request.append(('title', edit.title)) 
    if edit.description is not None:
        request.append(('description', edit.description))
    if edit.deadline is not None:
        request.append(('deadline', edit.deadline))
    
    # if no change is made
    if request == []:
        return
    

    update_sql = '''
        UPDATE tasks
        SET
    '''
    
    for column, value in request:
        update_sql += f' {column} = %s,'
        args.append(value)
    
    update_sql = update_sql[:-1]
    update_sql += '\nWHERE tasks.id = %s'
    args.append(task_id)
    
    conn = get_db_conn()
    cur = conn.cursor()
    
    # update task details
    cur.execute(update_sql, tuple(args))
    
    # Insert the assignees for the new task.
    insert_assignees_sql = """
        INSERT INTO task_assignees (task_id, profile_id)
        VALUES (%s, %s)
    """
    
    remove_assignees_sql = '''
        DELETE FROM task_assignees
        WHERE task_id = %s
    '''
    
    # Remove old assign records and create new ones
    if assignees is not None:
        
        cur.execute(remove_assignees_sql, (task_id,))
        for assignee in assignees:
            assignee_id = assignee.u_id
            cur.execute(insert_assignees_sql, (task_id, assignee_id))
    

    conn.commit()
    
    cur.close() 
    conn.close()
    return {"detail": "Task updated successfully"}

# return the task list based on the page type
@router.get("/tasks")
def get_tasks(page: str , profile_id: Union[int, None] = None, token: str = Depends(oauth2_scheme)):
    user_id = verify_token(token)
    conn = get_db_conn()
    cur = conn.cursor()
    
    if profile_id is not None:
        user_id = int(profile_id)
    
    select_task_list = None

    # include only the assined task for profile
    if page == 'profile':
        select_task_list = """
        SELECT tasks.id as task_id, tasks.title, tasks.description, tasks.deadline, tasks.progress
        FROM tasks               
            JOIN task_assignees ON tasks.id = task_assignees.task_id
            JOIN profiles ON task_assignees.profile_id = profiles.id
        WHERE profiles.id = %s
        ORDER BY tasks.deadline;
        """
        cur.execute(select_task_list, (user_id,))
    
    # include the assined task or created task for dashboard
    elif page == 'dashboard':
        select_task_list = """
        SELECT tasks.id as task_id, tasks.title, tasks.description, tasks.deadline, tasks.progress
        FROM tasks               
            LEFT OUTER JOIN task_assignees ON tasks.id = task_assignees.task_id
            LEFT OUTER JOIN profiles ON task_assignees.profile_id = profiles.id
        WHERE profiles.id = %s OR tasks.creator_id = %s
        ORDER BY tasks.deadline;
        """
        cur.execute(select_task_list, (user_id, user_id))
    else:
        raise HTTPException
    tasks = cur.fetchall()
    # Get column names
    column_names = [desc[0] for desc in cur.description]
    
    # Convert to list of dictionaries
    tasks_dict = {task[0]: dict(zip(column_names, task)) for task in tasks}
    
    select_assignees_sql = '''
    SELECT p.id, p.email_address as email, p.first_name as first_name, p.last_name as last_name, p.image as img 
    FROM task_assignees t
        JOIN PROFILES p on p.id = t.profile_id
    WHERE t.task_id = %s
    '''

    # Fetch assignees for each task
    for task_id, task in tasks_dict.items():
        cur.execute(select_assignees_sql, (task_id,))
        # assignees = [item[0] for item in cur.fetchall()]
        assignees = [User_profile(u_id=item[0], email=item[1], first_name=item[2], last_name=item[3], image=item[4]) for item in cur.fetchall()]
        task["assignees"] = assignees

    # Convert back to a list
    tasks = list(tasks_dict.values())
    cur.close()
    conn.close()

    return tasks

# delete task with given task id
@router.delete("/task")
def delete_task(task_id: int, token: str = Depends(oauth2_scheme)):
    # TODO: Only the task creator can delete teh task
    user_id = verify_token(token)
    conn = get_db_conn()
    cur = conn.cursor()
    
    # Check if the user is the creator of the task
    checkCreatorSQL = """
        SELECT * FROM TASKS
        WHERE id = %s AND CREATOR_ID = %s
    """
    cur.execute(checkCreatorSQL, (task_id, user_id))
    result = cur.fetchone()
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to delete this task")

    deleteTaskAssigneesSQL = """
        DELETE FROM TASK_ASSIGNEES 
        WHERE task_id = %s
    """
    cur.execute(deleteTaskAssigneesSQL, (task_id,))
    
    deleteTaskSQL = """
        DELETE FROM TASKS
        WHERE id = %s
    """
    cur.execute(deleteTaskSQL, (task_id,))
    
    conn.commit()
    
    cur.close()
    conn.close()


@router.get("/task_estimation")
async def task_estimation(title: str, desc : Union[str, None], token: str = Depends(oauth2_scheme)):
    return oracle.get_task_estimate(title, desc)

import re, os
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from llama_cpp import Llama

class Estimator:
    def __init__(self, model_path, download_url):
        self.model_path = model_path
        self.llm = None
        self.executor = ThreadPoolExecutor(max_workers=1)  # Creating a ThreadPoolExecutor instance
        self.future = None
        if not os.path.exists(self.model_path):
            os.makedirs(os.path.join(os.getcwd(), "models"), exist_ok=True)
            print(f"Downloading model from: {download_url}")
            # Submitting the download_model function to the executor.
            # This function will be run in a separate thread.
            self.future = self.executor.submit(self.download_model, download_url, self.model_path)
        self.initialise_llm()

    def download_model(self, url, path_to_save):
        urllib.request.urlretrieve(url, path_to_save)
        print(f"Model downloaded at: {path_to_save}")

    def initialise_llm(self):
        if self.llm is None:
            try:
                # Checking if there are no running futures.
                if self.future is None or self.future.done():
                    self.llm = Llama(model_path=self.model_path,n_ctx=512, n_batch=126)
                    self.llm.verbose = False
                    return True
            except Exception as e:
                print(f"FAILED TO LOAD LLM {e}")
                self.llm = None
                return False
        else:
            return True

    def extract_mean_std(self, text):
#         regex_black_magic = [
#         r"(?P<mean>\d+(?:\.\d+)?)\s+mins?.*?(?P<stddev>\d+(?:\.\d+)?)\s+-\s+\d+(?:\.\d+)?\s+min",
#         r"(?P<mean>\d+(?:\.\d+)?)\s+minutes.*?range.*?(?P<stddev>\d+(?:\.\d+)?)\s+-\s+\d+(?:\.\d+)?\s+minutes",
#         r"(?P<mean>\d+(?:\.\d+)?)\s+minutes.*?standard deviation.*?(?P<stddev>\d+(?:\.\d+)?)\s+minutes",
#         r"(?P<mean>\d+(?:\.\d+)?)\s+minutes\s+\(±(?P<stddev>\d+(?:\.\d+)?)\s+minute",
#         r"mean\s+of\s+(?P<mean>\d+(?:\.\d+)?)\s+minutes?.*?standard deviation\s+of\s+(?P<stddev>\d+(?:\.\d+)?)",
#         r"(?P<mean>\d+(?:\.\d+)?)\s+mins?.*?stddev\s+of\s+(?P<stddev>\d+(?:\.\d+)?)",
#         r"(?P<mean>\d+(?:\.\d+)?)\s+minutes?\s+and\s+a\s+std\.?\s+dev\.?\s+of\s+(?P<stddev>\d+(?:\.\d+)?)",
#         r'(?P<mean>\d+(?:\.\d+)?).*?(?P<stddev>\d+(?:\.\d+)?)'
#     ]

#         regex_black_magic = [
#     r"(?P<mean>\d+(?:\.\d+)?)\s+(mins?|hours?).*?(?P<stddev>\d+(?:\.\d+)?)\s+-\s+\d+(?:\.\d+)?\s+(min|hour)",
#     r"(?P<mean>\d+(?:\.\d+)?)\s+(minutes|hours).*?range.*?(?P<stddev>\d+(?:\.\d+)?)\s+-\s+\d+(?:\.\d+)?\s+(minutes|hours)",
#     r"(?P<mean>\d+(?:\.\d+)?)\s+(minutes|hours).*?standard deviation.*?(?P<stddev>\d+(?:\.\d+)?)\s+(minutes|hours)",
#     r"(?P<mean>\d+(?:\.\d+)?)\s+(minutes|hours)\s+\(±(?P<stddev>\d+(?:\.\d+)?)\s+(minute|hour)",
#     r"mean\s+of\s+(?P<mean>\d+(?:\.\d+)?)\s+(minutes?|hours?).+?standard deviation\s+of\s+(?P<stddev>\d+(?:\.\d+)?)",
#     r"(?P<mean>\d+(?:\.\d+)?)\s+(mins?|hours?).+?stddev\s+of\s+(?P<stddev>\d+(?:\.\d+)?)",
#     r"(?P<mean>\d+(?:\.\d+)?)\s+(minutes?|hours?)\s+and\s+a\s+std\.?\s+dev\.?\s+of\s+(?P<stddev>\d+(?:\.\d+)?)",
#     r'(?P<mean>\d+(?:\.\d+)?).*?(?P<stddev>\d+(?:\.\d+)?)'
# ]

#         regex_black_magic = regex_black_magic + [
#     r"(?P<mean>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?).*(?P<stddev>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)",
#     r"(?P<mean>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)\s+range.*?(?P<stddev>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)",
#     r"(?P<mean>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)\s+standard deviation.*?(?P<stddev>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)",
#     r"(?P<mean>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)\s+\(±(?P<stddev>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)",
#     r"mean\s+of\s+(?P<mean>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)\s+standard deviation\s+of\s+(?P<stddev>\d+(?:\.\d+)?-\d+(?:\.\d+)?)",
#     r"(?P<mean>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)\s+stddev\s+of\s+(?P<stddev>\d+(?:\.\d+)?-\d+(?:\.\d+)?)",
#     r"(?P<mean>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)\s+and\s+a\s+std\.?\s+dev\.?\s+of\s+(?P<stddev>\d+(?:\.\d+)?-\d+(?:\.\d+)?)",
#     r"(?P<mean>\d+(?:\.\d+)?-\d+(?:\.\d+)?)\s+(hours?|minutes?)\s+std\.?\s+dev\.?\s+(?P<stddev>\d+(?:\.\d+)?-\d+(?:\.\d+)?)"
# ]

        
        # if re.search(r'\bhours\b', text, re.IGNORECASE) is not None and re.search(r'\bminutes\b', text, re.IGNORECASE) is None:
        #     adjustment = 60
        # else:
        #     adjustment = 1

        # for pattern in regex_black_magic:
        #     match = re.search(pattern, text, re.IGNORECASE)
        #     if match:
        #         mean = match.group('mean')
        #         stddev = match.group('stddev')
        #         if len(mean.split('-')) > 1:
        #             mean = sum(map(list(mean.split('-')), int))/(len(mean.split('-')))
        #         if len(stddev.split('-')) > 1:
        #             stddev = sum(map(list(stddev.split('-')), int))/(len(stddev.split('-')))
        #         mean, stddev = float(mean), float(stddev)
        #         return mean*adjustment, stddev*adjustment
    #     if re.search(r'\bhours\b', text, re.IGNORECASE) is not None and re.search(r'\bminutes\b', text, re.IGNORECASE) is None:
    #         patterns = [
    #     r"\bMean\b:\s?(?P<mean_hour>\d+(?:\.\d+)?)\s?hour[s]?.*?Standard Deviation\b:\s?(?P<stddev_hour>\d+(?:\.\d+)?)\s?hour[s]?", # hours with decimal
    #     r"\bMean\b:\s?(?P<mean_hour>\d+)\s?hour[s]?.*?Standard Deviation\b:\s?(?P<stddev_hour>\d+)\s?hour[s]?", # just hours
    #         ]
    #     else:
    #         patterns = [
    #     r"\bMean\b:\s?(?P<mean_minute>\d+)\s?minute[s]?.*?Standard Deviation\b:\s?(?P<stddev_minute>\d+)\s?minute[s]?", # just minutes
    #     r"Mean\b:\s?(?P<mean_hour>\d+)?\s?(hour[s]?)?\s?(and)?\s?(?P<mean_minute>\d+)?\s?(minute[s]?)?.*?Standard Deviation\b:\s?(?P<stddev_hour>\d+)?\s?(hour[s]?)?\s?(and)?\s?(?P<stddev_minute>\d+)?\s?(minute[s]?)?", # hours and minutes
    # ]

    #     for pattern in patterns:
    #         match = re.search(pattern, text, re.I | re.S)
    #         if match:
    #             mean_hour = match.group("mean_hour") if "mean_hour" in match.groupdict() else None
    #             mean_minute = match.group("mean_minute") if "mean_minute" in match.groupdict() else None
    #             stddev_hour = match.group("stddev_hour") if "stddev_hour" in match.groupdict() else None
    #             stddev_minute = match.group("stddev_minute") if "stddev_minute" in match.groupdict() else None
    #             # print(mean_hour, mean_minute, stddev_hour, stddev_minute)
    #             if mean_hour and mean_minute:
    #                 mean = int(mean_hour) * 60 + int(mean_minute)
    #             elif mean_hour:
    #                 mean = int(float(mean_hour) * 60)
    #             elif mean_minute:
    #                 mean = int(mean_minute)
    #             else:
    #                 mean = None
                
    #             if stddev_hour and stddev_minute:
    #                 stddev = int(stddev_hour) * 60 + int(stddev_minute)
    #             elif stddev_hour:
    #                 stddev = int(float(stddev_hour) * 60)
    #             elif stddev_minute:
    #                 stddev = int(stddev_minute)
    #             else:
    #                 stddev = None
    #             if stddev != None and mean != None and stddev > mean:
    #                 stddev = stddev / 60 
    #             return mean, stddev

    #     return None, None

        
        lines = text.split('\n')
        value_map = {"Mean":0, "Standard Deviation":0}
        for i, line in enumerate(lines):
            for value in ["Mean", "Standard Deviation"]:
                if f"{value}:" in line or f"{value} :" in line:
                    # Extracting all numbers
                    if value_map[value] > 0:
                        continue
                    numbers = re.findall(r"[-+]?\d*\.\d+|\d+", line)
                    if len(numbers) == 0:
                        if i+1 < len(numbers):
                            line = lines[i+1]
                            numbers = re.findall(r"[-+]?\d*\.\d+|\d+", line)
                            numbers = list(map(float, numbers))
                            print(numbers)
                            if 'hour' in line or 'hours' in line.lower():
                                value_map[value] += numbers[0]*60
                                if len(numbers) > 1 and 'minutes' in line.lower():
                                    value_map[value] += numbers[1]
                            elif 'minutes' in line.lower():
                                value_map[value] += numbers[0]

                        # return None, None
                        continue
                    numbers = list(map(float, numbers))
                    # print(f'Extracted numbers: {numbers}')
                    if 'hour' in line or 'hours' in line.lower():
                        value_map[value] += numbers[0]*60
                        if len(numbers) > 1 and 'minutes' in line.lower():
                            value_map[value] += numbers[1]
                    elif 'minutes' in line.lower():
                        value_map[value] += numbers[0]
        
        if value_map["Mean"] == 0 or value_map["Standard Deviation"] == 0:
            numbers = [num[0] + num[1] for num in re.findall(r'(\b\d+)(\.\d+)?\b', text)]
            if len(numbers) == 2:
                numbers = list(map(float, numbers))
                if numbers[0] < 8 and numbers[1] < 8:
                    value_map["Mean"] = numbers[0]*60
                    value_map["Standard Deviation"] = numbers[1]*60
                else:
                    value_map["Mean"] = numbers[0]
                    value_map["Standard Deviation"] = numbers[1]
            else:
                return None, None
        if int(value_map["Mean"]) < 5 or int(value_map["Standard Deviation"]) < 3:
            return None, None
        return int(value_map["Mean"]), int(value_map["Standard Deviation"])


    def get_prompt(self, title, desc, aggressivity=1):
        if aggressivity == 2:
            return f"""
        Below is an instruction that describes a task. Write a response that appropriately completes the request.
        ### Instruction:
        Someone is attempting to complete the task entitle {title}, with the extra description {desc}. They want to know how long the task will take to complete. The task will never take more than 5 hours to complete. Some tasks may take much less time than that. They want statistical information about thte time to complete, specifically the mean and standard deviation.
        The response should contain the mean time to complete, as well standard deviation from mean time to complete. The response should never ask for additional information about the task. The response should format its estimates as 
        "Mean:
        Standard Deviation : "
        Remember, the estimates should be in minutes or hours. The answer should always contain the formatting above.
        ### Response:

        """
        elif aggressivity == 1:
            return f"""
        Below is an instruction that describes a task. Write a response that appropriately completes the request.
        ### Instruction:
        Someone is attempting to complete the task entitle {title}, with the extra description {desc}. They want to know how long the task will take to complete. The task will never take more than a couple hours to complete. Some tasks may take much less time than that. They want statistical information about thte time to complete, specifically the mean and standard deviation.
        The response should contain the mean time to complete, as well standard deviation from mean time to complete. The response should never ask for additional information about the task. The response should format its estimates as 
        "Mean:
        Standard Deviation : "
        Remember, the estimates should be in minutes or hours. The answer should always contain the formatting above. ALWAYS ALWAYS ALWAYS format it as "    "Mean:
        Standard Deviation : "
        ### Response:

        """
        elif aggressivity  == 3:
            return f"""
        Below is an instruction that describes a task. Write a response that appropriately completes the request.
        ### Instruction:
        Someone is attempting to complete the task entitle {title}, with the extra description {desc}. They want to know how long the task will take to complete. The task will never be that long to complete, anywhere between 15 minutes and 4 hours. They want statistical information about thte time to complete, specifically the mean and standard deviation.
        The response should contain the mean time to complete, as well standard deviation from mean time to complete. The response should never ask for additional information about the task. The response should format its estimates as 
        "Mean:
        Standard Deviation : "
        Remember, the estimates should be in minutes or hours. The answer should always contain the formatting above. ALWAYS ALWAYS ALWAYS format it as "    "Mean:
        Standard Deviation : "
        IF YOU DO NOT FORMAT YOUR ANSWER AS 
        "Mean:
        Standard Deviation : "
        THE WORLD WILL EXPLODE. THE WORLD WILL LITERALLY END IF YOU DO NOT FORMAT YOUR ANSWER CORRECTLY.
        ### Response:

        """


    def get_task_estimate(self, title, desc, max_tokens = 128):
        
        if not self.initialise_llm():
            return {"mean": int(np.random.normal(45, 15)), "std_dev": int(np.random.normal(15, 5))}        

        mean, std_dev = None, None
        attempt = 1
        while mean == None:
            output = self.llm(self.get_prompt(title, desc, attempt), max_tokens=max_tokens)
            output_text = output['choices'][0]['text'].strip()
            mean, std_dev = self.extract_mean_std(output_text)
            if (mean == None):
                print(f"Extraction failure (attempt {attempt}), retrying...")
                # print("LLM OUTPUT")
                # print(output_text)
                attempt += 1
                if attempt > 3:
                    mean = int(np.random.normal(45, 15))
                    std_dev = int(np.random.normal(15, 5))
                    # mean, std_dev = 30, 15
                    print("LLM FAILURE")
            else:
                print(f"Regex extracted : Mean {mean}, Std_dev {std_dev}")
        return {"mean": mean, "std_dev" : std_dev}

vicuna = "vicuna-7b-v1.3.ggmlv3.q2_K.bin"
vic_url = "https://huggingface.co/localmodels/Vicuna-7B-v1.3-ggml/resolve/main/vicuna-7b-v1.3.ggmlv3.q2_K.bin"
wizard = "wizardLM-7B.ggmlv3.q4_0.bin"
wiz_url = "https://huggingface.co/TheBloke/wizardLM-7B-GGML/resolve/main/wizardLM-7B.ggmlv3.q4_0.bin"

wizuncen = "WizardLM-7B-uncensored.ggmlv3.q2_K.bin"
wizuncen_url = "https://huggingface.co/TheBloke/WizardLM-7B-uncensored-GGML/resolve/main/WizardLM-7B-uncensored.ggmlv3.q2_K.bin"

choice = (wizard, wiz_url)
# choice = (wizuncen, wizuncen_url)
oracle = Estimator(os.path.join(os.getcwd(), "models", choice[0]), choice[1])
# oracle.get_task_estimate("")


# if __name__ == '__main__':
    # ...