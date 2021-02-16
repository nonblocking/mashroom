
import type {MashroomPortalMasterStateService, MashroomPortalStateService} from '../../../../type-definitions';

const ENCODED_STATE_QUERY_PARAM_NAME = 'mrps';

export default class MashroomPortalStateServiceImpl implements MashroomPortalMasterStateService {

    private urlState: any;
    private additionalQueryParams: any;
    private localStorage: Storage | undefined | null;
    private sessionStorage: Storage | undefined | null;

    constructor() {
        this.localStorage = global.localStorage;
        this.sessionStorage = global.sessionStorage;
        this.urlState = {};
        this.additionalQueryParams = {};

        const queryParams = this.getQueryParams();
        for (const paramName in queryParams) {
            if (queryParams.hasOwnProperty(paramName)) {
                // Process the encoded state
                if (paramName === ENCODED_STATE_QUERY_PARAM_NAME) {
                    try {
                        this.urlState = JSON.parse(atob(queryParams[ENCODED_STATE_QUERY_PARAM_NAME]));
                    } catch (e) {
                        console.error(`Unable to decode url parameter ${ENCODED_STATE_QUERY_PARAM_NAME}`, e);
                    }
                } else {
                    // Take over other query params as well
                    this.additionalQueryParams[paramName] = decodeURIComponent(queryParams[paramName]);
                }
            }
        }
    }

    getStateProperty(key: string) {
        return this.internalGetStateProperty(key);
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
            delete this.urlState[key];
        } else {
            this.urlState[key] = value;
        }

        // Update URL
        const baseUrl = `${global.location.protocol}//${global.location.host}${global.location.pathname}`;
        const hash = global.location.hash ? global.location.hash.substr(1) : null;
        const url = this.encodeStateIntoUrl(baseUrl, this.urlState, this.additionalQueryParams, hash);

        history.pushState({}, '', url);
    }

    setSessionStateProperty(key: string, value: any) {
        this.sessionStorage && this.sessionStorage.setItem(key, this.toStorableString(value));
    }

    setLocalStoreStateProperty(key: string, value: any) {
        this.localStorage && this.localStorage.setItem(key, this.toStorableString(value));
    }

    withKeyPrefix(prefix: string): MashroomPortalStateService {
        return {
            getStateProperty: (key: string) => this.internalGetStateProperty(key, prefix),
            setUrlStateProperty: this.setUrlStateProperty,
            encodeStateIntoUrl: this.encodeStateIntoUrl,
            setSessionStateProperty: (key: string, value: any) => this.setSessionStateProperty(prefix + key, value),
            setLocalStoreStateProperty: (key: string, value: any) => this.setLocalStoreStateProperty(prefix + key, value),
        };
    }

    private toStorableString(value: any) {
        if (typeof (value) === 'string') {
            return value;
        }
        return JSON.stringify(value);
    }

    private internalGetStateProperty(key: string, prefix = '') {
        return this.urlState[key] ||
            this.additionalQueryParams[key] ||
            (this.sessionStorage && this.sessionStorage.getItem(prefix + key)) ||
            (this.localStorage && this.localStorage.getItem(prefix + key));
    }

    private getQueryParams() {
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

