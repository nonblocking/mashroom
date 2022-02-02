import type {VHostDefinitions} from '../type-definitions/internal';

let _considerHttpHeaders: Array<string> = ['x-forwarded-host'];
let _vhostDefinitions: VHostDefinitions = {};

export default {
    set considerHttpHeaders(headers: Array<string>) {
        _considerHttpHeaders = headers;
    },
    get considerHttpHeaders() {
        return _considerHttpHeaders;
    },
    set vhostDefinitions(defs: VHostDefinitions) {
        _vhostDefinitions = defs;
    },
    get vhostDefinitions() {
        return _vhostDefinitions;
    },
}

