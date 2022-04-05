
import type {MashroomPortalMasterStateService, MashroomPortalStateService} from '../../../../type-definitions';

const ENCODED_STATE_QUERY_PARAM_NAME = 'mrps';

export default class MashroomPortalStateServiceImpl implements MashroomPortalMasterStateService {

    getStateProperty(key: string): any | null | undefined {
        return this._getStateProperty(key);
    }

    setUrlStateProperty(key: string, value: any | undefined | null): void {
        const urlState = this._getUrlState();
        const additionalQueryParams = this._getAdditionalQueryParams();

        if (!value) {
            delete urlState[key];
        } else {
            urlState[key] = value;
        }

        // Update URL
        const baseUrl = `${global.location.protocol}//${global.location.host}${global.location.pathname}`;
        const hash = global.location.hash ? global.location.hash.substr(1) : null;
        const url = this._encodeStateIntoUrl(baseUrl, urlState, additionalQueryParams, hash);

        history.pushState({}, '', url);
    }

    setSessionStateProperty(key: string, value: any): void {
        global.sessionStorage.setItem(key, this._toStorableString(value));
    }

    setLocalStoreStateProperty(key: string, value: any): void {
        global.localStorage.setItem(key, this._toStorableString(value));
    }

    withKeyPrefix(prefix: string): MashroomPortalStateService {
        return {
            getStateProperty: (key: string) => this._getStateProperty(key, prefix),
            setUrlStateProperty: (key: string, value: string) => this.setUrlStateProperty(key, value),
            setSessionStateProperty: (key: string, value: any) => this.setSessionStateProperty(prefix + key, value),
            setLocalStoreStateProperty: (key: string, value: any) => this.setLocalStoreStateProperty(prefix + key, value),
        };
    }

    private _encodeStateIntoUrl(baseUrl: string, state: any, additionalQueryParams?: Record<string, string> | undefined | null, hash?: string | undefined | null): string {
        let additionalQuery = '';
        for (const paramName in additionalQueryParams) {
            if (additionalQueryParams.hasOwnProperty(paramName)) {
                additionalQuery += `&${paramName}=${additionalQueryParams[paramName]}`;
            }
        }
        return `${baseUrl}?${ENCODED_STATE_QUERY_PARAM_NAME}=${btoa(JSON.stringify(state))}${additionalQuery}${hash ? `#${hash}` : ''}`;
    }


    private _toStorableString(value: any) {
        if (typeof (value) === 'string') {
            return value;
        }
        return JSON.stringify(value);
    }

    private _getStateProperty(key: string, prefix = '') {
        const urlState = this._getUrlState();
        const additionalQueryParams = this._getAdditionalQueryParams();
        return urlState[key] ||
            additionalQueryParams[key] ||
            (global.sessionStorage.getItem(prefix + key)) ||
            (global.localStorage.getItem(prefix + key));
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

    private _getUrlState(): any {
        let urlState = {};
        const queryParams = this._getQueryParams();
        if (queryParams[ENCODED_STATE_QUERY_PARAM_NAME]) {
            try {
                urlState = JSON.parse(atob(queryParams[ENCODED_STATE_QUERY_PARAM_NAME]));
            } catch (e) {
                console.error(`Unable to decode url parameter ${ENCODED_STATE_QUERY_PARAM_NAME}`, e);
            }
        }
        return urlState;
    }

    private _getAdditionalQueryParams(): any {
        const additionalQueryParams: any = {};
        const queryParams = this._getQueryParams();
        for (const paramName in queryParams) {
            if (paramName !== ENCODED_STATE_QUERY_PARAM_NAME) {
                additionalQueryParams[paramName] = decodeURIComponent(queryParams[paramName]);
            }
        }
        return additionalQueryParams;
    }
}

