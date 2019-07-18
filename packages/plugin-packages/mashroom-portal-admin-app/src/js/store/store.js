// @flow

import {createStore} from 'redux';
import reducers from './reducers';
import {PORTAL_APP_CONTROLS_SETTINGS_KEY} from '../constants';

import type {State, Store} from '../../../type-definitions';

let initialState: State = {
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

const store: Store = createStore(reducers, initialState);

if (process.env.NODE_ENV !== 'production') {
    store.subscribe(() => {
        console.debug('New state:', store.getState());
    });
}

export default store;
