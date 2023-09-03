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

ALTER table profiles owner to teamendgame;
ALTER table tasks owner to teamendgame;
ALTER table task_assignees owner to teamendgame;
ALTER table connections owner to teamendgame;
ALTER table connection_requests owner to teamendgame;
ALTER table messages owner to teamendgame;