
import {createStore} from 'redux';
import {PORTAL_APP_CONTROLS_SETTINGS_KEY} from '../constants';
import reducers from './reducers';

import type {State, Store} from '../types';

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
    selectedSite: null
};

let storeEnhancer = undefined;
if (process.env.NODE_ENV !== 'production') {
    storeEnhancer = (global as any).__REDUX_DEVTOOLS_EXTENSION__ && (global as any).__REDUX_DEVTOOLS_EXTENSION__();
}

const store: Store = createStore(reducers, initialState, storeEnhancer);

export default store;
