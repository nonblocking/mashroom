// @flow

import type {
    Subscription,
    PublishedMessage,
    ReceivedMessage,
    PublishedMessageStatus
} from '../../../type-definitions';

export const SET_SUBSCRIPTION = 'SET_SUBSCRIPTION';
export const ADD_PUBLISHED_MESSAGE = 'ADD_PUBLISHED_MESSAGE';
export const UPDATE_PUBLISHED_MESSAGE_STATUS = 'UPDATE_PUBLISHED_MESSAGE_STATUS';
export const ADD_RECEIVED_MESSAGE = 'ADD_RECEIVED_MESSAGE';

export const setSubscription = (subscription: Subscription) => {
    return {
        type: SET_SUBSCRIPTION,
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

