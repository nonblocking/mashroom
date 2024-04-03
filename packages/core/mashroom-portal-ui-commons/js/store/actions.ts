
export type ShowModalAction = {
    readonly type: 'SET_SHOW_MODAL';
    readonly dialogName: string;
    readonly show: boolean;
}

export type SetActiveTabAction = {
    readonly type: 'SET_ACTIVE_TAB';
    readonly dialogName: string;
    readonly active: string;
}

export const setShowModal = (dialogName: string, show: boolean): ShowModalAction => {
    return {
        type: 'SET_SHOW_MODAL',
        dialogName,
        show,
    };
};

export const setActiveTab = (dialogName: string, active: string): SetActiveTabAction => {
    return {
        type: 'SET_ACTIVE_TAB',
        dialogName,
        active,
    };
};
