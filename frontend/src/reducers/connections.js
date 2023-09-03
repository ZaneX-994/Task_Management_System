const connectionsReducer = (state = [], action) => {
    switch (action.type) {
        case "ADD_CONNECTION":
            return [...state, connection(undefined, action)];
        case "SET_CONNECTIONS":
            return action.connections;
        case "DELETE_CONNECTION":
            const ns = state;
            const ls = ns.filter((x) => x.u_id !== action.id);
            return ls;
        default:
            return state;
    }
};

const connection = (state, action) => {
    switch (action.type) {
        case "ADD_CONNECTION":
            return {
                u_id: action.u_id,
                first_name: action.first_name,
                last_name: action.last_name,
                image: action.image,
            };
        default:
            return state;
    }
};

export default connectionsReducer;
