// @flow

import type {HttpHeaderFilter as HttpHeaderFilterType, HttpHeaders} from '../type-definitions';

export default class HttpHeaderFilter implements HttpHeaderFilterType {

    _forwardHeaders: Array<RegExp>;

    constructor(forwardHeaders: Array<string>) {
        this._forwardHeaders = forwardHeaders.map((h) => {
            return new RegExp(h.replace('*', '.*'), 'gi');
        });
    }

    filter(headers: HttpHeaders): void {
        for (const headerName in headers) {
            if (headers.hasOwnProperty(headerName) && !this._forwardHeaders.find((r) =>  r.test(headerName))) {
                delete headers[headerName];
            }
        }
    }

}
