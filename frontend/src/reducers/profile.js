const profileReducer = (state = {}, action) => {
    switch (action.type) {
        //     case "ADD_PROFILE":
        //         return [...state, profile(undefined, action)];
        //     case "CHANGE_PROFILE_STATE":
        //         return state.map((t) => profile(t, action));
        case "EDIT_PROFILE_NAMES":
            return {
                ...state,
                first_name: action.first_name,
                last_name: action.last_name,
            };
        case "EDIT_PROFILE_EDIT":
            return {
                ...state,
                image: action.image,
            };
        case "SET_PROFILE":
            return action.profile;
        default:
            return state;
    }
};

export default profileReducer;
