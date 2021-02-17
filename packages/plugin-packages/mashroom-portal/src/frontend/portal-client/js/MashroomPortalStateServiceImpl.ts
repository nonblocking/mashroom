
import type {MashroomPortalMasterStateService, MashroomPortalStateService} from '../../../../type-definitions';

const ENCODED_STATE_QUERY_PARAM_NAME = 'mrps';

export default class MashroomPortalStateServiceImpl implements MashroomPortalMasterStateService {

    private _urlState: any;
    private _additionalQueryParams: any;
    private _localStorage: Storage | undefined | null;
    private _sessionStorage: Storage | undefined | null;

    constructor() {
        this._localStorage = global.localStorage;
        this._sessionStorage = global.sessionStorage;
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
                    this._additionalQueryParams[paramName] = decodeURIComponent(queryParams[paramName]);
                }
            }
        }
    }

    getStateProperty(key: string) {
        return this._getStateProperty(key);
    }

    encodeStateIntoUrl(baseUrl: string, state: any, additionalQueryParams?: Record<string, string> | undefined | null, hash?: string | undefined | null) {
        let additionalQuery = '';
        for (const paramName in additionalQueryParams) {
            if (additionalQueryParams.hasOwnProperty(paramName)) {
                additionalQuery += `&${paramName}=${additionalQueryParams[paramName]}`;
            }
        }
        return `${baseUrl}?${ENCODED_STATE_QUERY_PARAM_NAME}=${btoa(JSON.stringify(state))}${additionalQuery}${hash ? `#${hash}` : ''}`;
    }

    setUrlStateProperty(key: string, value: any | undefined | null) {
        if (!value) {
            delete this._urlState[key];
        } else {
            this._urlState[key] = value;
        }

        // Update URL
        const baseUrl = `${global.location.protocol}//${global.location.host}${global.location.pathname}`;
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

    withKeyPrefix(prefix: string): MashroomPortalStateService {
        return {
            getStateProperty: (key: string) => this._getStateProperty(key, prefix),
            setUrlStateProperty: this.setUrlStateProperty,
            encodeStateIntoUrl: this.encodeStateIntoUrl,
            setSessionStateProperty: (key: string, value: any) => this.setSessionStateProperty(prefix + key, value),
            setLocalStoreStateProperty: (key: string, value: any) => this.setLocalStoreStateProperty(prefix + key, value),
        };
    }

    private _toStorableString(value: any) {
        if (typeof (value) === 'string') {
            return value;
        }
        return JSON.stringify(value);
    }

    private _getStateProperty(key: string, prefix = '') {
        return this._urlState[key] ||
            this._additionalQueryParams[key] ||
            (this._sessionStorage && this._sessionStorage.getItem(prefix + key)) ||
            (this._localStorage && this._localStorage.getItem(prefix + key));
    }

    private _getQueryParams() {
        const queryString = global.location.search;
        const params: Record<string, string> = {};

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

