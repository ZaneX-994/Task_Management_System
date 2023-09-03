import argparse, random
from datetime import datetime, date, timedelta
from utility import get_db_conn
import itertools, random, os


import psycopg2
from psycopg2 import sql


IN_PROGRESS = 0.05
COMPLETED = 0.05
BLOCKED = 0.05
ASSIGN_1_EXTRA = 0.1
ASSIGN_ANOTHER_EXTRA = 0.2

name_map= {1: "Alicia", 2:"Lucas", 3:"Jordan", 4:"Nont", 5:"Zihang"}


def drop_and_recreate_db(database_name):
    conn = psycopg2.connect(
        dbname='postgres',  # Connect to the 'postgres' database
        user='teamendgame',
        host='localhost',
        password='password'
    )
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    cur.execute(
        sql.SQL("DROP DATABASE IF EXISTS {};").format(
            sql.Identifier(database_name)
        )
    )

    cur.execute(
        sql.SQL("CREATE DATABASE {};").format(
            sql.Identifier(database_name)
        )
    )

    cur.close()
    conn.close()

def generate_sample_data_user1_tasks(tasks_per_day, user_id=1):
    conn = get_db_conn()
    cur = conn.cursor()
    # cur.execute(f"DELETE FROM task_assignees WHERE profile_id = {user_id}")
    # conn.commit()

    # tasks_per_day = 6

    start_date = datetime.now()
    end_date = start_date + timedelta(weeks=4)
    num_days = (end_date - start_date).days
    # sample_tasks = []
    for day in range(num_days):
        for i in range(tasks_per_day):  # 6 tasks per day
            deadline = (start_date + timedelta(days=day)).date()
            mean = random.randint(30, 90)
            # mean = random.randint(45, 180)
            stddev = random.randint(5, 45)
            task = {
                # 'id' : f'{day * 6 + i + 1}',
                'creator_id': user_id, 
                'title': f'{name_map[user_id]} {day * 6 + i + 1}',
                'description': f'{name_map[user_id]} {day * 6 + i + 1}',
                # 'deadline': deadline.strftime('%Y-%m-%d'),
                'deadline': deadline,
                'mean': mean,
                'stddev': stddev
            }

            cur.execute("""
                INSERT INTO tasks (creator_id, title, description, deadline, initial_date, progress, mean, stddev)
                VALUES (%s, %s, %s, %s, CURRENT_DATE, 'Not Started', %s, %s) RETURNING id;
                """, (task['creator_id'], task['title'], task['description'], task['deadline'], task['mean'], task['stddev']))

            task_id = cur.fetchone()[0]
           
            cur.execute("""
                INSERT INTO task_assignees (task_id, profile_id)
                VALUES (%s, %s);
                """, (task_id, user_id))
            # sample_tasks.append(task)
    # sample_tasks.append({'id':'5000', 'title':'NULL_TEST'})

    # VERY LONG TITLE
    task = {
        'creator_id': user_id, 
        'title': 'TESTING HAVE A TASK WITH A VERY LONG TITLE NAME' + 'TEST '*25,
        'description': 'TESTING HAVE A TASK WITH A VERY LONG DESCRIPTION',
        'deadline': (start_date + timedelta(days=100)).date(),
        'mean': 30,
        'stddev': 15
    }

    cur.execute("""
        INSERT INTO tasks (creator_id, title, description, deadline, initial_date, progress, mean, stddev)
        VALUES (%s, %s, %s, %s, CURRENT_DATE, 'Not Started', %s, %s) RETURNING id;
        """, (task['creator_id'], task['title'], task['description'], task['deadline'], task['mean'], task['stddev']))

    task_id = cur.fetchone()[0]
    
    cur.execute("""
        INSERT INTO task_assignees (task_id, profile_id)
        VALUES (%s, %s);
        """, (task_id, user_id))

    # No deadline
    task = {'creator_id': user_id,
            'title': 'TEST NO DEADLINE',
            'description': 'TEST NO DEADLINE',
            'mean': 30,
            'stddev': 15
    }
    cur.execute("""
                INSERT INTO tasks (creator_id, title, description, initial_date, progress, mean, stddev)
                VALUES (%s, %s, %s, CURRENT_DATE, 'Not Started', %s, %s) RETURNING id;
                """, (task['creator_id'], task['title'], task['description'], task['mean'], task['stddev']))
    task_id = cur.fetchone()[0]
    cur.execute("""
        INSERT INTO task_assignees (task_id, profile_id)
        VALUES (%s, %s);
        """, (task_id, user_id))
    

    # No mean, stddev
    task = {'creator_id': user_id,
            'title': 'TEST NO TIME VARIABLES',
            'description': 'TEST NO TIME VARIABLES',
            'deadline': (start_date + timedelta(days=100)).date(),}
    cur.execute("""
                INSERT INTO tasks (creator_id, title, description, deadline, initial_date, progress)
                VALUES (%s, %s, %s, %s, CURRENT_DATE, 'Not Started') RETURNING id;
                """, (task['creator_id'], task['title'], task['description'], task['deadline']))
    task_id = cur.fetchone()[0]
    cur.execute("""
        INSERT INTO task_assignees (task_id, profile_id)
        VALUES (%s, %s);
        """, (task_id, user_id))

    conn.commit()
    cur.close()
    conn.close()

def assign_tasks_to_users(profile_ids):
    conn = get_db_conn()
    cur = conn.cursor()

    for profile_id in profile_ids:
        cur.execute("SELECT id FROM tasks WHERE creator_id = %s", (profile_id,))

        tasks = [task[0] for task in cur.fetchall()]
        assignee_ids = [id for id in profile_ids if id != profile_id]

        num_to_assign = max(1, int(len(tasks) * ASSIGN_1_EXTRA))
        tasks_to_assign = random.sample(tasks, num_to_assign)

        for task in tasks_to_assign:
            assignee_id = random.choice(assignee_ids)

            cur.execute("SELECT * FROM task_assignees WHERE task_id = %s AND profile_id = %s", (task, assignee_id))
            if cur.fetchone() is None:
                cur.execute("INSERT INTO task_assignees (task_id, profile_id) VALUES (%s, %s)", (task, assignee_id))

            if random.random() < ASSIGN_ANOTHER_EXTRA:
                remaining_assignee_ids = [id for id in assignee_ids if id != assignee_id]
                if remaining_assignee_ids:  # if there is at least one remaining
                    third_assignee_id = random.choice(remaining_assignee_ids)
                    cur.execute("SELECT * FROM task_assignees WHERE task_id = %s AND profile_id = %s", (task, third_assignee_id))
                    if cur.fetchone() is None:
                        cur.execute("INSERT INTO task_assignees (task_id, profile_id) VALUES (%s, %s)", (task, third_assignee_id))

    conn.commit()
    cur.close()
    conn.close()

drop = """
DROP TABLE IF EXISTS messages, connection_requests, connections, task_assignees, tasks, profiles CASCADE;
DROP TYPE IF EXISTS task_progress;
"""
setup = """
    CREATE TYPE task_progress AS ENUM ('Not Started', 'Blocked', 'Completed', 'In Progress');

CREATE table profiles (
    id SERIAL PRIMARY KEY,
    email_address VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    image TEXT
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    deadline DATE,
    initial_date DATE,
    completion_date DATE,
    progress task_progress NOT NULL,
    mean INTEGER, -- minutes
    stddev INTEGER, 
    description TEXT,
    FOREIGN Key (creator_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE task_assignees (
    task_id INTEGER NOT NULL,
    profile_id INTEGER NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, profile_id)
);

CREATE TABLE connections (
    id1 INTEGER NOT NULL,
    id2 INTEGER NOT NULL,
    PRIMARY KEY (id1, id2),
    FOREIGN KEY (id1) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (id2) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE connection_requests (
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    PRIMARY KEY (sender_id, receiver_id),
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    time_send TIMESTAMP
);
"""
new_users = """
    INSERT INTO profiles (email_address, first_name, last_name, password_hash, date_of_birth)
    VALUES
    ('alicia@test.com', 'Alicia', 'Shih', '$2b$12$Mv0bQVsoCqiVRnsNGCHTsu/.bbdPevWUSQNNrY85rLQlEdRGYQD4q', '1984-01-01'),
    ('lucas@test.com', 'Lucas', 'Warburton', '$2b$12$Mv0bQVsoCqiVRnsNGCHTsu/.bbdPevWUSQNNrY85rLQlEdRGYQD4q', '1984-01-01'),
    ('jordan@test.com', 'Jordan', 'Tam', '$2b$12$Mv0bQVsoCqiVRnsNGCHTsu/.bbdPevWUSQNNrY85rLQlEdRGYQD4q', '1956-01-01'),
    ('nont@test.com', 'Nont', 'Fakungkun', '$2b$12$Mv0bQVsoCqiVRnsNGCHTsu/.bbdPevWUSQNNrY85rLQlEdRGYQD4q', '1990-01-01'),
    ('zihang@test.com', 'Zihang', 'Xu', '$2b$12$Mv0bQVsoCqiVRnsNGCHTsu/.bbdPevWUSQNNrY85rLQlEdRGYQD4q', '1984-01-01'),
    ('noconnections@test.com', 'friend', 'less', '$2b$12$Mv0bQVsoCqiVRnsNGCHTsu/.bbdPevWUSQNNrY85rLQlEdRGYQD4q', '1984-01-01');
    """


def update_image(u_id, file):
    conn = get_db_conn()
    cur = conn.cursor()

    file = os.path.join(os.path.dirname(__file__), file)

    with open(file, 'r') as file:
        text = file.read()

    cur.execute(
            """
            UPDATE profiles
            SET image = %s
            WHERE id = %s
            """,
        (text, u_id)
    )

    conn.commit()
    cur.close()
    conn.close()
    
def random_task_progress():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM tasks")
    task_ids = [task[0] for task in cur.fetchall()]

    num_in_progress = max(1, int(len(task_ids) * IN_PROGRESS))
    num_completed = max(1, int(len(task_ids) * COMPLETED))
    num_blocked = max(1, int(len(task_ids) * BLOCKED))
    random.shuffle(task_ids)

    for i in range(num_in_progress):
        cur.execute("UPDATE tasks SET progress = 'In Progress' WHERE id = %s", (task_ids[i],))

    for i in range(num_in_progress, num_in_progress + num_completed):
        cur.execute("UPDATE tasks SET progress = 'Completed' WHERE id = %s", (task_ids[i],))

    for i in range(num_in_progress + num_completed, num_in_progress + num_completed + num_blocked):
        cur.execute("UPDATE tasks SET progress = 'Blocked' WHERE id = %s", (task_ids[i],))

    conn.commit()
    cur.close()
    conn.close()

def execute(query, message=""):
    conn = get_db_conn()
    cur = conn.cursor()
    if message != "":
        print(message)
    cur.execute(query)
    conn.commit()
    cur.close()
    conn.close()

def assign_first_5_tasks_to_demo_display():
    conn = get_db_conn()
    cur = conn.cursor()
    
    assignments = {
        1: [2, 3, 4, 5],
        9: [2, 3],
        # 3: [2, 3],
        # 4: [2],
    }

    for task_id, profile_ids in assignments.items():
        for profile_id in profile_ids:
            cur.execute(
                "INSERT INTO task_assignees (task_id, profile_id) VALUES (%s, %s)",
                (task_id, profile_id)
            )
            
    conn.commit()
    cur.close()
    conn.close()

def remake_database():
    print("Recreating Database...")
    drop_and_recreate_db("endgame")
    execute(setup, "Creating tables...")
    execute(new_users,"Creating alicia@test.com, lucas@test.com, jordan@test.com, nont@test.com, zain@test.com, noconnections@test.com...")
    print("NOTE : All test users have password 'password'")

    query = ""
    for a, b in list(itertools.combinations([1,2,3,4,5], 2)):
        query += f"INSERT into connections (id1, id2) values ({a}, {b});"
    execute(query, "Connecting the first five profiles...")


    for uid in [1,2,3,4,5]:
        update_image(uid, f'images/{uid-1}.txt')

    for uid in range(1,6):
        print(f"Generating Sample Task data for {name_map[uid]}, assigning {6-uid} tasks per day for the next month....")
        generate_sample_data_user1_tasks(6-uid, uid)

    print("Assigning some tasks...")
    assign_first_5_tasks_to_demo_display()

    print("Randomly assigning users to some portion of each other's tasks...")
    assign_tasks_to_users([1,2,3,4])


    print(f"Randomly settings {int(IN_PROGRESS)*100}% of tasks to 'In Progress', {int(COMPLETED)*100}% to 'Completed' and {int(BLOCKED*100)}% to 'Blocked'")



    random_task_progress()

if __name__ == "__main__":
    # parser = argparse.ArgumentParser(description="create sample data for endgames' task management app")
    # parser.add_argument('-r', '--remake-database', help="Remake Database", action='store_true') # TODO
    # parser.add_argument('-t', '--task-create', type=int,help="Takes a profile ID and creates a bunch of tasks from current day to 3 weeks onwards")

    # args = parser.parse_args()
    # if args.remake_database:
    # if args.task_create:
        # generate_sample_data_user1_tasks(args.task_create)
    # j

    remake_database()

    # conn = get_db_conn()
    # cur = conn.cursor()
    # cur.execute("select image from profiles where id = 2;")
    # print(cur.fetchall()[0][0])
    # cur.close()
    # conn.close()


