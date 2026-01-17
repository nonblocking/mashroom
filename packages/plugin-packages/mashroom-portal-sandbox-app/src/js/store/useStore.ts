import {createContext, useContext, useRef, createElement} from 'react';
import {create, useStore} from 'zustand/react';
import { redux, devtools } from 'zustand/middleware';
import reducers from './reducers';

import type { ReactNode} from 'react';
import type {State} from '../types';
import type {AnyAction} from './actions';
import type {StateCreator, StoreApi} from 'zustand/vanilla';

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

// In a Microfrontend we shouldn't use a "global" state shared by all instances,
// therefore, we attach it to the context

const StoreContext = createContext<StoreApi<StateWithDispatch> | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
    const storeRef = useRef<StoreApi<StateWithDispatch>>(undefined);
    if (!storeRef.current) {
        storeRef.current = create<StateWithDispatch>()(
            init,
        );
    }

    return createElement(StoreContext.Provider, { value: storeRef.current! }, children);
};

const useStoreInContext = <S>(selector: (state: StateWithDispatch) => S) => {
    const store = useContext(StoreContext);
    if (!store) {
        throw new Error('Missing StoreProvider');
    }
    return useStore(store, selector);
};

export default useStoreInContext;

