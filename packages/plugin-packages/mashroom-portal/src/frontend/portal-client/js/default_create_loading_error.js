// @flow

import {WINDOW_VAR_PORTAL_APP_LOADING_FAILED_MSG} from '../../../backend/constants';

import type {CreateLoadingError} from '../../../../type-definitions';

const defaultCreateLoadingError: CreateLoadingError = (id, pluginName, title) => {
    const rawMessage = window[WINDOW_VAR_PORTAL_APP_LOADING_FAILED_MSG] || 'Portal app ${name} is temporarily not available';
    const message = rawMessage.replace('${name}', title || pluginName);
    const errorElement = document.createElement('div');
    errorElement.className = 'mashroom-portal-app-loading-error';
    errorElement.innerHTML = `<span>${message}</span>`;
    return errorElement;
};

export default defaultCreateLoadingError;
