
import { create } from 'zustand/react';
import { redux, devtools } from 'zustand/middleware';
import reducers from './reducers';

import type {State} from '../types';
import type {AnyAction} from './actions';
import type {StateCreator} from 'zustand/vanilla';

const initialState: State = {
    knownPortalApps: [],
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

type StateWithDispatch = State & {
    dispatch: (action: AnyAction) => AnyAction;
};

let init: StateCreator<any, any, any> = redux(reducers, initialState);

if (process.env.NODE_ENV !== 'production') {
    init = devtools(init, {
        name: 'Mashroom Portal Sandbox App',
    });
}

const useStore = create<StateWithDispatch>()(
   init,
);

export default useStore;

