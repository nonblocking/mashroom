
import type {
    AddMessagePublishedByAppAction,
    AddMessagePublishedBySandboxAction,
    SetActivePortalAppAction,
    SetAppLoadingErrorAction,
    SetKnownPortalAppsAction,
    SetHostWidthAction,
    SetSelectedPortalAppAction,
    SetTopicSubscribedByAppAction
} from './actions';
import type {MashroomKnownPortalApp} from '@mashroom/mashroom-portal/type-definitions';
import type {
    State,
    ActivePortalApp,
    MessageBusCommunication,
    PortalAppHost,
    SelectedPortalApp
} from '../types';

const knownPortalApps = (state: Array<MashroomKnownPortalApp>, action: SetKnownPortalAppsAction) => {
    if (typeof (state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case 'SET_AVAILABLE_PORTAL_APPS': {
            return action.knownPortalApps;
        }
        default:
            return state;
    }
};

const appLoadingError = (state: boolean, action: SetAppLoadingErrorAction) => {
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

const selectedPortalApp = (state: SelectedPortalApp | undefined | null, action: SetSelectedPortalAppAction) => {
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

const activePortalApp = (state: ActivePortalApp | undefined | null, action: SetActivePortalAppAction) => {
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

const messageBusCom = (state: MessageBusCommunication, action: SetTopicSubscribedByAppAction | AddMessagePublishedByAppAction | AddMessagePublishedBySandboxAction) => {
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

const host = (state: PortalAppHost, action: SetHostWidthAction) => {
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

export default (state: State, action: any): State => {
    return {
        knownPortalApps: knownPortalApps(state.knownPortalApps, action),
        selectedPortalApp: selectedPortalApp(state.selectedPortalApp, action),
        appLoadingError: appLoadingError(state.appLoadingError, action),
        activePortalApp: activePortalApp(state.activePortalApp, action),
        messageBusCom: messageBusCom(state.messageBusCom, action),
        host: host(state.host, action),
    };
};
