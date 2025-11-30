
import type {
    SetPrivateUserTopicsSubscriptionAction,
    SetGlobalNotificationsSubscriptionAction,
    AddPublishedMessageAction,
    UpdatedPublishedMessageStatusAction,
    AddReceivedMessageAction
} from './actions';

import type {State, PublishedMessages, ReceivedMessages, Subscription,} from '../types';

const privateUserTopicsSubscription = (state: Subscription, action: SetPrivateUserTopicsSubscriptionAction): Subscription => {
    if (typeof (state) === 'undefined') {
        return {
            topic: '',
            status: 'Pending'
        };
    }

    switch (action.type) {
        case 'SET_PRIVATE_USER_TOPICS_SUBSCRIPTION': {
            return action.subscription;
        }
        default:
            return state;
    }
};

const globalNotificationsSubscription = (state: Subscription, action: SetGlobalNotificationsSubscriptionAction): Subscription => {
    if (typeof (state) === 'undefined') {
        return {
            topic: '',
            status: 'Pending'
        };
    }

    switch (action.type) {
        case 'SET_GLOBAL_NOTIFICATIONS_SUBSCRIPTION': {
            return action.subscription;
        }
        default:
            return state;
    }
};

const publishedMessages = (state: PublishedMessages, action: AddPublishedMessageAction | UpdatedPublishedMessageStatusAction): PublishedMessages => {
    if (typeof (state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case 'ADD_PUBLISHED_MESSAGE': {
            return [action.message, ...state];
        }
        case 'UPDATE_PUBLISHED_MESSAGE_STATUS': {
            return state.map((m) => {
                if (m.id === action.messageId) {
                    return {
                        ...m, status: action.status,
                        errorMessage: action.errorMessage,
                    };
                }
                return m;
            });
        }
        default:
            return state;
    }
};

const receivedMessages = (state: ReceivedMessages, action: AddReceivedMessageAction): ReceivedMessages => {
    if (typeof (state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case 'ADD_RECEIVED_MESSAGE': {
            return [action.message, ...state];
        }
        default:
            return state;
    }
};

export default (state: State, action: any): State => {
    return {
        privateUserTopicsSubscription: privateUserTopicsSubscription(state.privateUserTopicsSubscription, action),
        globalNotificationsSubscription: globalNotificationsSubscription(state.globalNotificationsSubscription, action),
        publishedMessages: publishedMessages(state.publishedMessages, action),
        receivedMessages: receivedMessages(state.receivedMessages, action),
    };
};
