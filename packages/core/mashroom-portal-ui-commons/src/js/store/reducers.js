// @flow

import {combineReducers} from 'redux';
import {reducer as form} from 'redux-form';
import {SET_ACTIVE_TAB, SET_SHOW_MODAL} from './actions';

import type {Action, ModalState, TabDialogState} from '../../../type-definitions';

const modals = (state: ModalState, action: Action): ModalState => {
    if (typeof (state) === 'undefined') {
        return {};
    }

    switch (action.type) {
        case SET_SHOW_MODAL: {
            return {
                ...state,
                [action.dialogName]: {
                    show: action.show,
                },
            };
        }
        default:
            return state;
    }
};

const tabDialogs = (state: TabDialogState, action: Action): TabDialogState => {
    if (typeof (state) === 'undefined') {
        return {};
    }

    switch (action.type) {
        case SET_ACTIVE_TAB: {
            return {
                ...state,
                [action.dialogName]: {
                    active: action.active,
                },
            };
        }
        default:
            return state;
    }
};

export const mashroomPortalCommonsCombineReducers = (reducers?: any = {}) => {

    const mergedReducers = {
        ...reducers, modals,
        tabDialogs,
        form,
    };

    // $FlowFixMe
    return combineReducers(mergedReducers);
};
