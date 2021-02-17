
import type {HttpHeaders} from '../../type-definitions';
import type {HttpHeaderFilter as HttpHeaderFilterType} from '../../type-definitions/internal';

export default class HttpHeaderFilter implements HttpHeaderFilterType {

    private _forwardHeadersRegexes: Array<RegExp>;

    constructor(forwardHeaders: Array<string>) {
        this._forwardHeadersRegexes = forwardHeaders.map((h) => {
            return new RegExp(h.replace('*', '.*'), 'gi');
        });
    }

    filter(headers: HttpHeaders): void {
        for (const headerName in headers) {
            if (headers.hasOwnProperty(headerName) && !this._forwardHeadersRegexes.find((r) => {
                r.lastIndex = 0;
                return r.test(headerName);
            })) {
                delete headers[headerName];
            }
        }
    }

}
