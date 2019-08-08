// @flow

import {mashroomPortalCommonsCombineReducers} from '@mashroom/mashroom-portal-ui-commons';
import {
    SET_AVAILABLE_PORTAL_APPS,
    SET_SELECTED_PORTAL_APP,
    SET_ACTIVE_PORTAL_APP,
    SET_SUBSCRIBED_TOPICS,
    ADD_RECEIVED_MESSAGE,
    ADD_SENT_MESSAGE,
    SET_HOST_WIDTH
} from './actions';

import type {
    Action,
    SelectedPortalApp,
    ActivePortalApp,
    MessageBusCommunication, PortalAppHost
} from '../../../type-definitions';

import type {MashroomAvailablePortalApp} from '@mashroom/mashroom-portal/type-definitions';

const availablePortalApps = (state: Array<MashroomAvailablePortalApp>, action: Action): Array<MashroomAvailablePortalApp> => {
    if (typeof(state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case SET_AVAILABLE_PORTAL_APPS: {
            return action.availablePortalApps;
        }
        default:
            return state;
    }
};

const selectedPortalApp = (state: ?SelectedPortalApp, action: Action): ?SelectedPortalApp => {
    if (typeof(state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case SET_SELECTED_PORTAL_APP: {
            return action.selectedPortalApp;
        }
        default:
            return state;
    }
};

const activePortalApp = (state: ?ActivePortalApp, action: Action): ?ActivePortalApp => {
    if (typeof(state) === 'undefined') {
        return null;
    }

    switch (action.type) {
        case SET_ACTIVE_PORTAL_APP: {
            return action.activePortalApp;
        }
        default:
            return state;
    }
};

const messageBusCom = (state: MessageBusCommunication, action: Action): MessageBusCommunication => {
    if (typeof(state) === 'undefined') {
        return {
            subscribedTopics: [],
            receivedMessages: [],
            sentMessages:[]
        };
    }

    switch (action.type) {
        case SET_SUBSCRIBED_TOPICS: {
            return Object.assign({}, state, {
                subscribedTopics: action.topics
            });
        }
        case ADD_RECEIVED_MESSAGE: {
            return Object.assign({}, state, {
                receivedMessages: [...state.receivedMessages, action.message]
            });
        }
        case ADD_SENT_MESSAGE: {
            return Object.assign({}, state, {
                sentMessages: [...state.sentMessages, action.message]
            });
        }
        default:
            return state;
    }
};

const host = (state: PortalAppHost, action: Action): PortalAppHost => {
    if (typeof(state) === 'undefined') {
        return {
            width: '100%'
        };
    }

    switch (action.type) {
        case SET_HOST_WIDTH: {
            return Object.assign({}, state, {
                width: action.width
            });
        }
        default:
            return state;
    }
};

// $FlowFixMe
export default mashroomPortalCommonsCombineReducers({
    availablePortalApps,
    selectedPortalApp,
    activePortalApp,
    messageBusCom,
    host
});
