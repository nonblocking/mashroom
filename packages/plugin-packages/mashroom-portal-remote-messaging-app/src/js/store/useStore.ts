
import { create } from 'zustand/react';
import {devtools, redux} from 'zustand/middleware';
import reducers from './reducers';

import type {State} from '../types';
import type {AnyAction} from './actions';
import type {StateCreator} from 'zustand/vanilla';

const initialState: State = {
    privateUserTopicsSubscription: {
        topic: '(remote user topics)',
        status: 'Pending'
    },
    globalNotificationsSubscription: {
        topic: '(remote global notifications topic)',
        status: 'Pending'
    },
    publishedMessages: [],
    receivedMessages: [],
};

type StateWithDispatch = State & {
    dispatch: (action: AnyAction) => AnyAction;
};

let init: StateCreator<any, any, any> = redux(reducers, initialState);

if (process.env.NODE_ENV !== 'production') {
    init = devtools(init, {
        name: 'Mashroom Portal Remote Messaging App',
    });
}

const useStore = create<StateWithDispatch>()(
  init
);

export default useStore;
