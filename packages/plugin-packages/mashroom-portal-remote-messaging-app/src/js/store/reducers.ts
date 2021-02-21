
import {mashroomPortalCommonsCombineReducers} from '@mashroom/mashroom-portal-ui-commons';
import {
    ADD_PUBLISHED_MESSAGE,
    ADD_RECEIVED_MESSAGE,
    SET_SUBSCRIPTION,
    UPDATE_PUBLISHED_MESSAGE_STATUS
} from './actions';

import type {Reducer} from 'redux';
import type {State, PublishedMessages, ReceivedMessages, Subscription,} from '../types';

const subscription: Reducer<Subscription> = (state , action) => {
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

const publishedMessages: Reducer<PublishedMessages> = (state, action) => {
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

const receivedMessages: Reducer<ReceivedMessages> = (state, action): ReceivedMessages => {
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

export default mashroomPortalCommonsCombineReducers<State>({
    subscription,
    publishedMessages,
    receivedMessages
});
