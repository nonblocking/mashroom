
import {mashroomPortalCommonsCombineReducers} from '@mashroom/mashroom-portal-ui-commons';
import type {
    AddMessagePublishedByAppAction,
    AddMessagePublishedBySandboxAction,
    SetActivePortalAppAction,
    SetAppLoadingErrorAction,
    SetAvailablePortalAppsAction,
    SetHostWidthAction,
    SetSelectedPortalAppAction,
    SetTopicSubscribedByAppAction
} from './actions';

import type {Reducer} from 'redux';
import type {MashroomAvailablePortalApp} from '@mashroom/mashroom-portal/type-definitions';
import type {
    State,
    ActivePortalApp,
    MessageBusCommunication,
    PortalAppHost,
    SelectedPortalApp
} from '../types';

const availablePortalApps: Reducer<Array<MashroomAvailablePortalApp>, SetAvailablePortalAppsAction> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case 'SET_AVAILABLE_PORTAL_APPS': {
            return action.availablePortalApps;
        }
        default:
            return state;
    }
};

const appLoadingError: Reducer<boolean, SetAppLoadingErrorAction> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return false;
    }

    switch (action.type) {
        case 'SET_APP_LOADING_ERROR': {
            return action.error;
        }
        default:
            return state;
    }
};

const selectedPortalApp: Reducer<SelectedPortalApp | undefined | null, SetSelectedPortalAppAction> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case 'SET_SELECTED_PORTAL_APP': {
            return action.selectedPortalApp;
        }
        default:
            return state;
    }
};

const activePortalApp: Reducer<ActivePortalApp | undefined | null, SetActivePortalAppAction> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case 'SET_ACTIVE_PORTAL_APP': {
            return action.activePortalApp;
        }
        default:
            return state;
    }
};

const messageBusCom: Reducer<MessageBusCommunication, SetTopicSubscribedByAppAction | AddMessagePublishedByAppAction | AddMessagePublishedBySandboxAction> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return {
            topicsSubscribedByApp: [],
            publishedByApp: [],
            publishedBySandbox: []
        };
    }

    switch (action.type) {
        case 'SET_TOPICS_SUBSCRIBED_BY_APP': {
            return {...state, topicsSubscribedByApp: action.topics};
        }
        case 'ADD_MESSAGE_PUBLISHED_BY_APP': {
            return {...state, publishedByApp: [...state.publishedByApp, action.message]};
        }
        case 'ADD_MESSAGE_PUBLISHED_BY_SANDBOX': {
            return {...state, publishedBySandbox: [...state.publishedBySandbox, action.message]};
        }
        default:
            return state;
    }
};

const host: Reducer<PortalAppHost, SetHostWidthAction> = (state, action) => {
    if (typeof (state) === 'undefined') {
        return {
            width: '100%'
        };
    }

    switch (action.type) {
        case 'SET_HOST_WIDTH': {
            return {...state, width: action.width};
        }
        default:
            return state;
    }
};

export default mashroomPortalCommonsCombineReducers<State>({
    availablePortalApps,
    selectedPortalApp,
    appLoadingError,
    activePortalApp,
    messageBusCom,
    host
});
