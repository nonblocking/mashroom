
export const SET_SHOW_MODAL = 'SET_SHOW_MODAL';
export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB';

export const setShowModal = (dialogName: string, show: boolean) => {
    return {
        type: SET_SHOW_MODAL,
        dialogName,
        show,
    };
};

export const setActiveTab = (dialogName: string, active: string) => {
    return {
        type: SET_ACTIVE_TAB,
        dialogName,
        active,
    };
};
