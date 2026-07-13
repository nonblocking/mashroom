
import type {
    Subscription,
    PublishedMessage,
    ReceivedMessage,
    PublishedMessageStatus
} from '../types';

export type SetPrivateUserTopicsSubscriptionAction = {
    readonly type: 'SET_PRIVATE_USER_TOPICS_SUBSCRIPTION';
    readonly subscription: Subscription;
}

export type SetGlobalNotificationsSubscriptionAction = {
    readonly type: 'SET_GLOBAL_NOTIFICATIONS_SUBSCRIPTION';
    readonly subscription: Subscription;
}

export type AddPublishedMessageAction = {
    readonly type: 'ADD_PUBLISHED_MESSAGE';
    readonly message: PublishedMessage;
}

export type UpdatedPublishedMessageStatusAction = {
    readonly type: 'UPDATE_PUBLISHED_MESSAGE_STATUS';
    readonly messageId: string;
    readonly status: PublishedMessageStatus;
    readonly errorMessage?: string;
}

export type AddReceivedMessageAction = {
    readonly type: 'ADD_RECEIVED_MESSAGE';
    readonly message: ReceivedMessage;
}

export type AnyAction = SetPrivateUserTopicsSubscriptionAction | SetGlobalNotificationsSubscriptionAction | AddPublishedMessageAction | UpdatedPublishedMessageStatusAction | AddReceivedMessageAction;

export const setPrivateUserTopicsSubscription = (subscription: Subscription): SetPrivateUserTopicsSubscriptionAction => {
    return {
        type: 'SET_PRIVATE_USER_TOPICS_SUBSCRIPTION',
        subscription,
    };
};

export const setGlobalNotificationsSubscription = (subscription: Subscription): SetGlobalNotificationsSubscriptionAction => {
    return {
        type: 'SET_GLOBAL_NOTIFICATIONS_SUBSCRIPTION',
        subscription,
    };
};

export const addPublishedMessage = (message: PublishedMessage): AddPublishedMessageAction => {
    return {
        type: 'ADD_PUBLISHED_MESSAGE',
        message,
    };
};

export const updatePublishedMessageStatus = (messageId: string, status: PublishedMessageStatus, errorMessage?: string): UpdatedPublishedMessageStatusAction => {
    return {
        type: 'UPDATE_PUBLISHED_MESSAGE_STATUS',
        messageId,
        status,
        errorMessage,
    };
};

export const addReceivedMessage = (message: ReceivedMessage): AddReceivedMessageAction => {
    return {
        type: 'ADD_RECEIVED_MESSAGE',
        message,
    };
};

