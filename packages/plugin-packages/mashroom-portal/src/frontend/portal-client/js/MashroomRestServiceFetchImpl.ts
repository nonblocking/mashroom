
import {RestError} from './RestError';

import type {MashroomRestService} from '../../../../type-definitions/internal';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type CreatedResponse = {
    readonly location: string;
}

const CSRF_TOKEN_META = document.querySelector('meta[name="csrf-token"]');
const CSRF_TOKEN = CSRF_TOKEN_META && CSRF_TOKEN_META.getAttribute('content');

/**
 * A RestService impl based on fetch API
 */
export default class RestServiceFetchImpl implements MashroomRestService {

    constructor(private apiBasePath = '') {
    }

    get(path: string, extraHeaders?: Record<string, string>): Promise<any> {
        return this._fetch(path, 'GET', null, extraHeaders);
    }

    post(path: string, data: any, extraHeaders?: Record<string, string>): Promise<any> {
        return this._fetch(path, 'POST', data, extraHeaders);
    }

    put(path: string, data: any, extraHeaders?: Record<string, string>): Promise<void> {
        return this._fetch(path, 'PUT', data, extraHeaders);
    }

    delete(path: string, extraHeaders?: Record<string, string>): Promise<void> {
        return this._fetch(path, 'DELETE', null, extraHeaders);
    }

    withBasePath(apiBasePath: string): MashroomRestService {
        return new RestServiceFetchImpl(apiBasePath);
    }

    private _fetch(path: string, method: HttpMethod = 'GET', jsonData: any | undefined | null, extraHeaders?: Record<string, string> | undefined): Promise<any> {
        return new Promise((resolve, reject) => {

            const headers: any = {
                ...extraHeaders || {},
                Accept: 'application/json',
            };

            if (CSRF_TOKEN) {
                headers['X-CSRF-Token'] = CSRF_TOKEN;
            }

            const config: any = {
                method,
                headers,
                credentials: 'same-origin',
            };

            if (jsonData && method !== 'GET') {
                headers['Content-Type'] = 'application/json';
                config['body'] = JSON.stringify(jsonData);
            }

            const fetchUrl = `${this.apiBasePath}${path}`;
            fetch(fetchUrl, config)
                .then((response: Response) => {
                    response.text()
                        .then((responseText) => {
                            let responseBody = null;

                            try {
                                responseBody = JSON.parse(responseText);
                            } catch (e) {
                                // JSON response is optional
                                responseBody = responseText;
                            }

                            const locationHeader = response.headers.get('Location');

                            if (response.status === 201 && locationHeader) {
                                const createdResponse: CreatedResponse = {
                                    location: locationHeader,
                                };
                                resolve(createdResponse);
                            } else if (response.ok) {
                                resolve(responseBody);
                            } else {
                                reject(this._createError(response.status, response.statusText));
                            }
                        })
                        .catch((error) => {
                            reject(this._createError(400, error.message, error.stack));
                        });
                })
                .catch((error) => {
                    reject(this._createError(0, error.message, error.stack));
                });
        });
    }

    _createError(status: number, message: string, stack?: string): Error {
        return new RestError(status, message, stack);
    }

}
