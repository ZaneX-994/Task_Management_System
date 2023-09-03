// **************
// Task Functions
// **************

export const addTask = (object) => {
    return {
        type: "ADD_TASK",
        task_id: object.task_id,
        title: object.title,
        description: object.description,
        deadline: object.deadline,
        assignees: object.assignees,
        progress: "Not Started",
    };
};
export const editTask = (object) => {
    return {
        type: "EDIT_TASK",
        task_id: object.task_id,
        title: object.title,
        description: object.description,
        deadline: object.deadline,
        assignees: object.assignees,
        progress: object.progress,
    };
};

export const changeTaskState = (task_id, progress) => {
    return {
        type: "CHANGE_TASK_STATE",
        task_id,
        progress,
    };
};

export const setTasks = (tasks) => {
    return {
        type: "SET_TASK",
        tasks,
    };
};

export const deleteTasks = (id) => {
    return {
        type: "DELETE_TASK",
        id,
    };
};

// **************
// Login Function
// **************

export const setProfile = (profile) => {
    return {
        type: "SET_PROFILE",
        profile,
    };
};

export const editProfileNames = (object) => {
    return {
        type: "EDIT_PROFILE_NAMES",
        first_name: object.first_name,
        last_name: object.last_name
    };
};

export const editProfileImg = (object) => {
    return {
        type: "EDIT_PROFILE_IMG",
        image: object.image,
    };
};


// **************
// Login Function
// **************

export const login = () => {
    return {
        type: "LOGIN",
    };
};

export const logout = () => {
    return {
        type: "LOGOUT",
    };
};

// ********************
// Connection Functions
// ********************

export const setConnections = (connections) => {
    return {
        type: "SET_CONNECTIONS",
        connections,
    };
};

export const addConnections = (user) => {
    return {
        type: "ADD_CONNECTION",
        u_id: user.u_id,
        first_name: user.first_name,
        last_name: user.last_name,
        image: user.image
    };
};

export const deleteConnection = (id) => {
    return {
        type: "DELETE_CONNECTION",
        id,
    };
};


// ******************
// Messages Functions
// ******************


export const setMessages = (messages) => {
    return {
        type: "SET_MESSAGES",
        messages,
    };
};

export const addMessage = (message) => {
    return {
        type: "ADD_MESSAGE",
        content: message.content,
        profile_id: message.profile_id, 
        first_name: message.first_name, 
        image: message.image            
};
};
