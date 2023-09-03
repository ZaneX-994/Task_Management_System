const messagesReducer = (state = [], action) => {
    switch (action.type) {
        case "ADD_MESSAGE":
            return [...state, message(undefined, action)];
        case "SET_MESSAGES":
            return action.messages;
        default:
            return state;
    }
};

const message = (state, action) => {
    switch (action.type) {
        case "ADD_MESSAGE":
            return {
                content: action.content,
                profile_id: action.profile_id, 
                first_name: action.first_name, 
                image: action.image            
            };
        default:
            return state;
    }
};

export default messagesReducer;
