
import { combineReducers} from 'redux';
import type { SetActiveTabAction, ShowModalAction} from './actions';

import type {Reducer, ReducersMapObject} from 'redux';
import type {ModalState, TabDialogState} from '../../type-definitions';

const modals: Reducer<ModalState, ShowModalAction> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return {};
    }

    switch (action.type) {
        case 'SET_SHOW_MODAL': {
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

const tabDialogs: Reducer<TabDialogState, SetActiveTabAction> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return {};
    }

    switch (action.type) {
        case 'SET_ACTIVE_TAB': {
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

// eslint-disable-next-line import/prefer-default-export
export const mashroomPortalCommonsCombineReducers = <S>(reducers: ReducersMapObject<S, any>) => {
    const mergedReducers: any = {
        ...reducers,
        modals,
        tabDialogs,
    };
    return combineReducers<S>(mergedReducers);
};
