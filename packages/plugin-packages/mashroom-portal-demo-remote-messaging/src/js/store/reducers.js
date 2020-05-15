// @flow

import {mashroomPortalCommonsCombineReducers} from '@mashroom/mashroom-portal-ui-commons';
import {
    ADD_PUBLISHED_MESSAGE,
    ADD_RECEIVED_MESSAGE,
    SET_SUBSCRIPTION,
    UPDATE_PUBLISHED_MESSAGE_STATUS
} from './actions';

import type {Action, PublishedMessages, ReceivedMessages, Subscription,} from '../../../type-definitions';

const subscription = (state: Subscription, action: Action): Subscription => {
    if (typeof (state) === 'undefined') {
        return {
            topic: '',
            status: 'Pending'
        };
    }

    switch (action.type) {
        case SET_SUBSCRIPTION: {
            return action.subscription;
        }
        default:
            return state;
    }
};

const publishedMessages = (state: PublishedMessages, action: Action): PublishedMessages => {
    if (typeof (state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case ADD_PUBLISHED_MESSAGE: {
            return [action.message, ...state];
        }
        case UPDATE_PUBLISHED_MESSAGE_STATUS: {
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

const receivedMessages = (state: ReceivedMessages, action: Action): ReceivedMessages => {
    if (typeof (state) === 'undefined') {
        return [];
    }

    switch (action.type) {
        case ADD_RECEIVED_MESSAGE: {
            return [action.message, ...state];
        }
        default:
            return state;
    }
};

// $FlowFixMe
export default mashroomPortalCommonsCombineReducers({
    subscription,
    publishedMessages,
    receivedMessages
});
