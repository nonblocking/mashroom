// @flow

import type { MashroomAvailablePortalApp } from '@mashroom/mashroom-portal/type-definitions';
import type {SelectedPortalApp, ActivePortalApp, MessageBusMessage} from '../../../type-definitions';

export const SET_AVAILABLE_PORTAL_APPS = 'SET_AVAILABLE_PORTAL_APPS';
export const SET_SELECTED_PORTAL_APP = 'SET_SELECTED_PORTAL_APP';
export const SET_ACTIVE_PORTAL_APP = 'SET_ACTIVE_PORTAL_APP';
export const SET_APP_LOADING_ERROR = 'SET_APP_LOADING_ERROR';
export const ADD_MESSAGE_PUBLISHED_BY_APP = 'ADD_MESSAGE_PUBLISHED_BY_APP';
export const ADD_MESSAGE_PUBLISHED_BY_SANDBOX = 'ADD_MESSAGE_PUBLISHED_BY_SANDBOX';
export const SET_HOST_WIDTH = 'SET_HOST_WIDTH';
export const SET_TOPICS_SUBSCRIBED_BY_APP = 'SET_TOPICS_SUBSCRIBED_BY_APP';

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

export const setAppLoadingError = (error: boolean) => {
    return {
        type: SET_APP_LOADING_ERROR,
        error,
    };
};

export const addMessagePublishedByApp = (message: MessageBusMessage) => {
    return {
        type: ADD_MESSAGE_PUBLISHED_BY_APP,
        message,
    };
};

export const addMessagePublishedBySandbox = (message: MessageBusMessage) => {
    return {
        type: ADD_MESSAGE_PUBLISHED_BY_SANDBOX,
        message,
    };
};

export const setHostWidth = (width: string) => {
    return {
        type: SET_HOST_WIDTH,
        width,
    };
};

export const setTopicsSubscribedByApp = (topics: Array<string>) => {
    return {
        type: SET_TOPICS_SUBSCRIBED_BY_APP,
        topics,
    };
};
