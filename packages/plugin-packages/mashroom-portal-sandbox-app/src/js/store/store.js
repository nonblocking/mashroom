// @flow

import {createStore} from 'redux';
import reducers from './reducers';

import type {State, Store} from '../../../type-definitions';

let initialState: State = {
    availablePortalApps: [],
    selectedPortalApp: null,
    activePortalApp: null,
    messageBusCom: {
        subscribedTopics: [],
        receivedMessages: [],
        sentMessages:[]
    },
    host: {
        width:'100%'
    }
};

let storeEnhancer = undefined;
if (process.env.NODE_ENV !== 'production') {
    storeEnhancer = window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__();
}

// $FlowFixMe
const store: Store = createStore(reducers, initialState, storeEnhancer);

export default store;

