
import {createStore} from 'redux';
import reducers from './reducers';

import type {State, Store} from '../types';

const initialState: State = {
    subscription: {
        topic: '',
        status: 'Pending'
    },
    publishedMessages: [],
    receivedMessages: [],
};

let storeEnhancer = undefined;
if (process.env.NODE_ENV !== 'production') {
    storeEnhancer = (global as any).__REDUX_DEVTOOLS_EXTENSION__ &&  (global as any).__REDUX_DEVTOOLS_EXTENSION__();
}

const store: Store = createStore(reducers, initialState, storeEnhancer);

export default store;

