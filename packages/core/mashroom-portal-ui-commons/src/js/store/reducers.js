// @flow

import {combineReducers} from 'redux';
import {reducer as form} from 'redux-form';
import {SET_SHOW_MODAL, SET_ACTIVE_TAB} from './actions';

import type {ModalState, TabDialogState, Action} from '../../../type-definitions';

const modals = (state: ModalState, action: Action): ModalState => {
    if (typeof(state) === 'undefined') {
        return {};
    }

    switch (action.type) {
        case SET_SHOW_MODAL: {
            return Object.assign({}, state, {
               [action.dialogName]: {
                   show: action.show,
               },
            });
        }
        default:
            return state;
    }
};

const tabDialogs = (state: TabDialogState, action: Action): TabDialogState => {
    if (typeof(state) === 'undefined') {
        return {};
    }

    switch (action.type) {
        case SET_ACTIVE_TAB: {
            return Object.assign({}, state, {
                [action.dialogName]: {
                    active: action.active,
                },
            });
        }
        default:
            return state;
    }
};

export const mashroomPortalCommonsCombineReducers = (reducers?: any = {}) => {

    const mergedReducers = Object.assign({}, reducers, {
        modals,
        tabDialogs,
        form,
    });

    // $FlowFixMe
    return combineReducers(mergedReducers);
};
