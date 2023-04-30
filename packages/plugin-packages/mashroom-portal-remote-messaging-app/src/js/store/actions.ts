
import type {
    Subscription,
    PublishedMessage,
    ReceivedMessage,
    PublishedMessageStatus
} from '../types';

export const SET_PRIVATE_USER_TOPICS_SUBSCRIPTION = 'SET_PRIVATE_USER_TOPICS_SUBSCRIPTION';
export const SET_GLOBAL_NOTIFICATIONS_SUBSCRIPTION = 'SET_GLOBAL_NOTIFICATIONS_SUBSCRIPTION';
export const ADD_PUBLISHED_MESSAGE = 'ADD_PUBLISHED_MESSAGE';
export const UPDATE_PUBLISHED_MESSAGE_STATUS = 'UPDATE_PUBLISHED_MESSAGE_STATUS';
export const ADD_RECEIVED_MESSAGE = 'ADD_RECEIVED_MESSAGE';

export const setPrivateUserTopicsSubscription = (subscription: Subscription) => {
    return {
        type: SET_PRIVATE_USER_TOPICS_SUBSCRIPTION,
        subscription,
    };
};

export const setGlobalNotificationsSubscription = (subscription: Subscription) => {
    return {
        type: SET_GLOBAL_NOTIFICATIONS_SUBSCRIPTION,
        subscription,
    };
};

export const addPublishedMessage = (message: PublishedMessage) => {
    return {
        type: ADD_PUBLISHED_MESSAGE,
        message,
    };
};

export const updatePublishedMessageStatus = (messageId: string, status: PublishedMessageStatus, errorMessage?: string) => {
    return {
        type: UPDATE_PUBLISHED_MESSAGE_STATUS,
        messageId,
        status,
        errorMessage,
    };
};

export const addReceivedMessage = (message: ReceivedMessage) => {
    return {
        type: ADD_RECEIVED_MESSAGE,
        message,
    };
};

