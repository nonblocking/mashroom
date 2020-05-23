
import type {HttpHeaders} from '../../type-definitions';
import type {HttpHeaderFilter as HttpHeaderFilterType} from '../../type-definitions/internal';

export default class HttpHeaderFilter implements HttpHeaderFilterType {

    private forwardHeadersRegexes: Array<RegExp>;

    constructor(forwardHeaders: Array<string>) {
        this.forwardHeadersRegexes = forwardHeaders.map((h) => {
            return new RegExp(h.replace('*', '.*'), 'gi');
        });
    }

    filter(headers: HttpHeaders): void {
        for (const headerName in headers) {
            if (headers.hasOwnProperty(headerName) && !this.forwardHeadersRegexes.find((r) =>  r.test(headerName))) {
                delete headers[headerName];
            }
        }
    }

}
