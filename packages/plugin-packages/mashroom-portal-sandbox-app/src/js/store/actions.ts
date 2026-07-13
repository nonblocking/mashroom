
import type {MashroomKnownPortalApp} from '@mashroom/mashroom-portal/type-definitions';
import type {SelectedPortalApp, ActivePortalApp, MessageBusMessage} from '../types';

export type SetKnownPortalAppsAction = {
    readonly type: 'SET_AVAILABLE_PORTAL_APPS';
    readonly knownPortalApps: Array<MashroomKnownPortalApp>;
}

export type SetSelectedPortalAppAction = {
    readonly type: 'SET_SELECTED_PORTAL_APP';
    readonly selectedPortalApp: SelectedPortalApp | undefined | null;
}

export type SetActivePortalAppAction = {
    readonly type: 'SET_ACTIVE_PORTAL_APP';
    readonly activePortalApp: ActivePortalApp | undefined | null;
}

export type SetAppLoadingErrorAction = {
    readonly type: 'SET_APP_LOADING_ERROR';
    readonly error: boolean;
}

export type AddMessagePublishedByAppAction = {
    readonly type: 'ADD_MESSAGE_PUBLISHED_BY_APP';
    readonly message: MessageBusMessage;
}

export type AddMessagePublishedBySandboxAction = {
    readonly type: 'ADD_MESSAGE_PUBLISHED_BY_SANDBOX';
    readonly message: MessageBusMessage;
}

export type SetHostWidthAction = {
    readonly type: 'SET_HOST_WIDTH';
    readonly width: string;
}

export type SetTopicSubscribedByAppAction = {
    readonly type: 'SET_TOPICS_SUBSCRIBED_BY_APP';
    readonly topics:  Array<string>;
}

export type AnyAction = SetKnownPortalAppsAction | SetSelectedPortalAppAction | SetActivePortalAppAction | SetAppLoadingErrorAction | AddMessagePublishedByAppAction | AddMessagePublishedBySandboxAction | SetHostWidthAction | SetTopicSubscribedByAppAction;

export const setKnownApps = (knownPortalApps: Array<MashroomKnownPortalApp>): SetKnownPortalAppsAction => {
    return {
        type: 'SET_AVAILABLE_PORTAL_APPS',
        knownPortalApps,
    };
};

export const setSelectedPortalApp = (selectedPortalApp: SelectedPortalApp | undefined | null): SetSelectedPortalAppAction => {
    return {
        type: 'SET_SELECTED_PORTAL_APP',
        selectedPortalApp,
    };
};

export const setActivePortalApp = (activePortalApp: ActivePortalApp | undefined | null): SetActivePortalAppAction => {
    return {
        type: 'SET_ACTIVE_PORTAL_APP',
        activePortalApp,
    };
};

export const setAppLoadingError = (error: boolean): SetAppLoadingErrorAction => {
    return {
        type: 'SET_APP_LOADING_ERROR',
        error,
    };
};

export const addMessagePublishedByApp = (message: MessageBusMessage): AddMessagePublishedByAppAction => {
    return {
        type: 'ADD_MESSAGE_PUBLISHED_BY_APP',
        message,
    };
};

export const addMessagePublishedBySandbox = (message: MessageBusMessage): AddMessagePublishedBySandboxAction => {
    return {
        type: 'ADD_MESSAGE_PUBLISHED_BY_SANDBOX',
        message,
    };
};

export const setHostWidth = (width: string): SetHostWidthAction => {
    return {
        type: 'SET_HOST_WIDTH',
        width,
    };
};

export const setTopicsSubscribedByApp = (topics: Array<string>): SetTopicSubscribedByAppAction => {
    return {
        type: 'SET_TOPICS_SUBSCRIBED_BY_APP',
        topics,
    };
};
