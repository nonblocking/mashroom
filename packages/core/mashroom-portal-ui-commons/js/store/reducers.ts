
import {AnyAction, CombinedState, combineReducers} from 'redux';
import {reducer as form} from 'redux-form';
import {SET_ACTIVE_TAB, SET_SHOW_MODAL} from './actions';

import type {Reducer, ReducersMapObject} from 'redux';
import type {CommonState, ModalState, TabDialogState} from '../../type-definitions';

const modals: Reducer<ModalState> = (state, action) => {
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

const tabDialogs: Reducer<TabDialogState> = (state, action) => {
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

export const mashroomPortalCommonsCombineReducers = <S>(reducers: ReducersMapObject<S, AnyAction>) => {
    const mergedReducers = {
        ...reducers,
        modals,
        tabDialogs,
        form,
    };
    return combineReducers<S>(mergedReducers);
};
