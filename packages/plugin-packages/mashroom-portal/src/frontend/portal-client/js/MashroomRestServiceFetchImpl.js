// @flow

import type {MashroomRestService, CreatedResponse} from '../../../../type-definitions';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * A RestService impl based on fetch API
 */
export default class RestServiceFetchImpl implements MashroomRestService {

    _apiBasePath: string;

    constructor(apiBasePath?: string) {
        this._apiBasePath = apiBasePath || '';
    }

    get(path: string, extraHeaders?: {}): Promise<any> {
        return this._fetch(path, 'GET', null, extraHeaders);
    }

    post(path: string, data: any, extraHeaders?: {}): Promise<any> {
        return this._fetch(path, 'POST', data, extraHeaders);
    }

    put(path: string, data: any, extraHeaders?: {}): Promise<void> {
        return this._fetch(path, 'PUT', data, extraHeaders);
    }

    delete(path: string, extraHeaders?: {}): Promise<void> {
        return this._fetch(path, 'DELETE', null, extraHeaders);
    }

    withBasePath(apiBasePath: string) {
        return new RestServiceFetchImpl(apiBasePath);
    }

    _fetch(path: string, method: HttpMethod = 'GET', jsonData: ?any, extraHeaders?: {}): Promise<any> {
        return new Promise((resolve, reject) => {

            const headers: any = Object.assign({},extraHeaders || {}, {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            });

            if (method !== 'GET') {
                const metaCsrfToken = document.querySelector('meta[name="csrf-token"]');
                if (metaCsrfToken) {
                    const token = metaCsrfToken.getAttribute('content');
                    headers['X-CSRF-Token'] = token;
                }
            }

            const config: any = {
                method,
                headers,
                credentials: 'include',
            };

            if (jsonData) {
                config['body'] = JSON.stringify(jsonData);
            }

            fetch(`${this._apiBasePath}${path}`, config).then((response: Response) => {
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
                        reject(error);
                    });
            })
            .catch((error) => {
                console.error('Processing response failed:', error);
                reject(error);
            });
        });
    }

    // TODO: improve error handling

    _createError(status: number, message: string): Error {
        return new Error(`HTTP ${status}: ${message}`);
    }

}
