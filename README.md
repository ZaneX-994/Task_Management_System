# Task Management System (capstone-project-3900w11bendgame)
# Efficiently manage and track your tasks with our system 

## Description

The Task Management System is a powerful tool designed to foster clear, real-time understanding of task allocation and progress in a collaborative setting. It provides a comprehensive overview of the status of the tasks that each member of the team is working on, significantly reducing the chance of misunderstanding, task duplication, and inefficient use of resources. 

The project aims to simplify the process of task organization and tracking, providing users with an efficient way to manage their workload, prioritize tasks, and collaborate with team members. By doing so, the Task Management System enhances team productivity and collaboration, and ensures smooth progression of projects.

Our system also addresses the issue of unstructured or inefficient communication systems which are often a hurdle in collaborative work environments. It offers an integrated platform for communication, allowing team members to ask questions, share notes, and update task statuses in a centralized, structured way. 

This project embodies a commitment to privacy, and we've made it a top priority in our system. Moreover, our integrated chat feature facilitates seamless communication among team members.

In summary, the Task Management System is not just a task management tool, but a comprehensive solution for effective project management, enabling smoother workflows, increased productivity, and efficient collaboration.

## Getting Started

**We recommend running this in your local machine (MacBook M1 Chips)**

This project consists of two main parts: the backend, which is implemented using Python, and the frontend, which is built using React.js. The PostgreSQL database is used for data storage.

Follow these steps to set up and start the system:

### Prerequisites

Ensure you have the following installed on your system:

* Python 3.x
* npm (typically installed with Node.js)
* PostgreSQL

### Backend

The backend requires a number of Python packages. These dependencies are listed in the requirements.txt file in the /backend directory.

1. Navigate to the /backend directory.
    ```
    cd backend
    ```
2. Install the necessary Python packages using pip.
    ```
    pip install -r requirements.txt
    ```
3. Start the backend server using uvicorn.
    ```
    uvicorn main:app --reload
    ```
### Frontend

The frontend is built with React.js and can be started using npm.

1. Navigate to the frontend directory (assuming you're in the project root).
    ```
    cd frontend
    ```
2. Install necessary npm packages.
    ```
    npm install
    ```
3. Start the frontend application.
    ```
    npm start
    ```

### Database

1. Our server has its own postgres user teamendgame, to create this user, please run this command:
    ```
    psql -c "CREATE role teamendgame with createdb login encrypted password 'password';"
    ```
    then
    ```
    psql -c "CREATE DATABASE endgame;"
    ```
    then
    ```
    psql -c "ALTER DATABASE endgame OWNER TO teamendgame;"
    ```

3. Navigate to the backend directory, and run
    ```
    python3 setup.py
    ```
This will create the database and its tables, as well as populate them with a
variety of sample data for testing. For instance if you wanted to test out automatic
scheduling on a user with a lot of assigned tasks, you could login with email
alicia@test.com and password password.
