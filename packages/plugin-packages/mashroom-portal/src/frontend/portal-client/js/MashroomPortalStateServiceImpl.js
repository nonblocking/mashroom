// @flow

import type {MashroomPortalStateService} from '../../../../type-definitions';

const ENCODED_STATE_QUERY_PARAM_NAME = 'mrps';

export default class MashroomPortalStateServiceImpl implements MashroomPortalStateService {

    _urlState: any;
    _additionalQueryParams: any;
    _localStorage: ?Storage;
    _sessionStorage: ?Storage;

    constructor() {
        this._localStorage = global._localStorage;
        this._sessionStorage = global._sessionStorage;
        this._urlState = {};
        this._additionalQueryParams = {};

        const queryParams = this._getQueryParams();
        for (const paramName in queryParams) {
            if (queryParams.hasOwnProperty(paramName)) {
                // Process the encoded state
                if (paramName === ENCODED_STATE_QUERY_PARAM_NAME) {
                    try {
                        this._urlState = JSON.parse(atob(queryParams[ENCODED_STATE_QUERY_PARAM_NAME]));
                    } catch (e) {
                        console.error(`Unable to decode url parameter ${ENCODED_STATE_QUERY_PARAM_NAME}`, e);
                    }
                } else {
                    // Take over other query params as well
                    this._additionalQueryParams[paramName] = queryParams[paramName];
                }
            }
        }
    }

    getStateProperty(key: string) {
        return this._urlState[key] || this._additionalQueryParams[key] || (this._sessionStorage && this._sessionStorage.getItem(key)) || (this._localStorage && this._localStorage.getItem(key));
    }

    encodeStateIntoUrl(baseUrl: string, state: any, additionalQueryParams?: ?{[string]: string}, hash?: ?string) {
        let additionalQuery = '';
        for (const paramName in additionalQueryParams) {
            if (additionalQueryParams.hasOwnProperty(paramName)) {
                additionalQuery += `&${paramName}=${additionalQueryParams[paramName]}`;
            }
        }
        return `${baseUrl}?${ENCODED_STATE_QUERY_PARAM_NAME}=${btoa(JSON.stringify(state))}${additionalQuery}${hash ? '#' + hash : ''}`;
    }

    setUrlStateProperty(key: string, value: ?any) {
        if (!value) {
            delete this._urlState[key];
        } else {
            this._urlState[key] = value;
        }

        // Update URL
        const baseUrl = global.location.protocol + '//' + global.location.host + global.location.pathname;
        const hash = global.location.hash ? global.location.hash.substr(1) : null;
        const url = this.encodeStateIntoUrl(baseUrl, this._urlState, this._additionalQueryParams, hash);

        history.pushState({}, '', url);
    }

    setSessionStateProperty(key: string, value: any) {
        this._sessionStorage && this._sessionStorage.setItem(key, this._toStorableString(value));
    }

    setLocalStoreStateProperty(key: string, value: any) {
        this._localStorage && this._localStorage.setItem(key, this._toStorableString(value));
    }

    _toStorableString(value: any) {
        if (typeof(value) === 'string') {
            return value;
        }
        return JSON.stringify(value);
    }

    _getQueryParams() {
        const queryString = global.location.search;
        const params = {};

        try {
            if (queryString && queryString.length > 0) {
                queryString.substr(1).split('&').forEach((p) => {
                    const parts = p.split('=');
                    params[parts[0]] = parts[1];
                });
            }
        } catch (e) {
            console.error('Parsing query params failed', e);
        }

        return params;
    }
}

