// @flow

import type { MashroomAvailablePortalApp, MashroomPortalAppUserPermissions } from '@mashroom/mashroom-portal/type-definitions';
import type {SelectedPortalApp, ActivePortalApp, MessageBusMessage} from '../../../type-definitions';
import type {MashroomPluginConfig} from '@mashroom/mashroom/type-definitions';

export const SET_AVAILABLE_PORTAL_APPS = 'SET_AVAILABLE_PORTAL_APPS';
export const SET_SELECTED_PORTAL_APP = 'SET_SELECTED_PORTAL_APP';
export const SET_ACTIVE_PORTAL_APP = 'SET_ACTIVE_PORTAL_APP';
export const ADD_RECEIVED_MESSAGE = 'ADD_RECEIVED_MESSAGE';
export const ADD_SENT_MESSAGE = 'ADD_SENT_MESSAGE';
export const SET_HOST_WIDTH = 'SET_HOST_WIDTH';
export const SET_SUBSCRIBED_TOPICS = 'SET_SUBSCRIBED_TOPICS';

export const setAvailablePortalApps = (availablePortalApps: Array<MashroomAvailablePortalApp>) => {
    return {
        type: SET_AVAILABLE_PORTAL_APPS,
        availablePortalApps,
    };
};

export const setSelectedPortalApp = (selectedPortalApp: ?SelectedPortalApp) => {
    return {
        type: SET_SELECTED_PORTAL_APP,
        selectedPortalApp,
    };
};

export const setActivePortalApp = (activePortalApp: ?ActivePortalApp) => {
    return {
        type: SET_ACTIVE_PORTAL_APP,
        activePortalApp,
    };
};

export const addReceivedMessage = (message: MessageBusMessage) => {
    return {
        type: ADD_RECEIVED_MESSAGE,
        message,
    };
};

export const addSentMessage = (message: MessageBusMessage) => {
    return {
        type: ADD_SENT_MESSAGE,
        message,
    };
};

export const setHostWidth = (width: string) => {
    return {
        type: SET_HOST_WIDTH,
        width,
    };
};

export const setSubscribedTopics = (topics: Array<string>) => {
    return {
        type: SET_SUBSCRIBED_TOPICS,
        topics,
    };
};
