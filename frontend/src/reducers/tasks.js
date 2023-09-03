const taskReducer = (state = [], action) => {
    switch (action.type) {
        case "ADD_TASK":
            return [...state, task(undefined, action)];
        case "CHANGE_TASK_STATE":
            return state.map((t) => task(t, action));
        case "EDIT_TASK":
            return state.map((t) => task(t, action));
        case "SET_TASK":
            return action.tasks;
        case "DELETE_TASK":
            const ns = state;
            const ls = ns.filter((x) => x.task_id !== action.id);
            return ls;
        default:
            return state;
    }
};

const task = (state, action) => {
    switch (action.type) {
        case "ADD_TASK":
            return {
                task_id: action.task_id,
                title: action.title,
                description: action.description,
                deadline: action.deadline,
                assignees: action.assignees,
                progress: "Not Started",
            };
        case "CHANGE_TASK_STATE":
            if (state.task_id !== action.task_id) {
                return state;
            }
            return {
                ...state,
                progress: action.progress,
            };
        case "EDIT_TASK":
            if (state.task_id !== action.task_id) {
                return state;
            }
            return {
                task_id: action.task_id,
                title: action.title,
                description: action.description,
                deadline: action.deadline,
                assignees: action.assignees,
                progress: action.progress,
            };
        default:
            return state;
    }
};

export default taskReducer;
