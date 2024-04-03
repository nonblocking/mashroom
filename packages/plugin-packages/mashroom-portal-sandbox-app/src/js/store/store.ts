
import {legacy_createStore} from 'redux';
import reducers from './reducers';

import type {State, Store} from '../types';

const initialState: State = {
    availablePortalApps: [],
    selectedPortalApp: null,
    appLoadingError: false,
    activePortalApp: null,
    messageBusCom: {
        topicsSubscribedByApp: [],
        publishedByApp: [],
        publishedBySandbox:[]
    },
    host: {
        width:'100%'
    }
};

let storeEnhancer = undefined;
if (process.env.NODE_ENV !== 'production') {
    storeEnhancer = (global as any).__REDUX_DEVTOOLS_EXTENSION__ && (global as any).__REDUX_DEVTOOLS_EXTENSION__();
}

const store: Store = legacy_createStore(reducers, initialState, storeEnhancer);

export default store;

