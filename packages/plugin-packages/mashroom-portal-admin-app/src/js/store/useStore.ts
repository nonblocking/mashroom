
import {devtools, redux} from 'zustand/middleware';
import {create} from 'zustand/react';
import {PORTAL_APP_CONTROLS_SETTINGS_KEY} from '../constants';
import reducers from './reducers';

import type {AnyAction} from './actions';
import type {State} from '../types';
import type {StateCreator} from 'zustand/vanilla';

const initialState: State = {
    user: {
        userName: null,
    },
    languages: {
        current: 'en',
        default: 'en',
        available: []
    },
    sites: {
        loading: false,
        error: false,
        sites: []
    },
    pages: {
        loading: false,
        error: false,
        pages: [],
        pagesFlattened: []
    },
    existingRoles: [],
    availableThemes: [],
    availableLayouts: [],
    availableApps: {
        loading: false,
        error: false,
        apps: null
    },
    portalAppControls: window.localStorage.getItem(PORTAL_APP_CONTROLS_SETTINGS_KEY) ? window.localStorage.getItem(PORTAL_APP_CONTROLS_SETTINGS_KEY) === 'true' : true,
    selectedPortalApp: null,
    selectedPage: null,
    selectedSite: null,
    modals: {},
    appWrapperDataAttributes: {},
    tabDialogs: {},
};

export type Dispatch = (action: AnyAction) => AnyAction;

type StateWithDispatch = State & {
    dispatch: Dispatch;
};

let init: StateCreator<any, any, any> = redux(reducers, initialState);

if (process.env.NODE_ENV !== 'production') {
    init = devtools(init, {
        name: 'Mashroom Portal Admin App',
    });
}

const useStore = create<StateWithDispatch>()(
    init,
);

export default useStore;
