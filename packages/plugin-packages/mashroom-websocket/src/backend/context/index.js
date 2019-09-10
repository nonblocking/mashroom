// @flow

import type {MashroomWebSocketServer} from '../../../type-definitions';

let server: any = null;
let restrictToRoles: ?Array<string> = null;
let basePath = '/websocket';
let pingIntervalSec = 30;
let maxConnections = 2000;

export default {
    get server(): MashroomWebSocketServer {
        return server;
    },
    set server(_server: MashroomWebSocketServer) {
        server = _server;
    },
    get restrictToRoles(): ?Array<string> {
        return restrictToRoles;
    },
    set restrictToRoles(roles: ?Array<string>) {
        restrictToRoles = roles;
    },
    get basePath(): string {
        return basePath;
    },
    set basePath(path: string) {
        basePath = path;
    },
    get pingIntervalSec(): number {
        return pingIntervalSec;
    },
    set pingIntervalSec(interval: number) {
        pingIntervalSec = interval;
    },
    get maxConnections(): number {
        return maxConnections;
    },
    set maxConnections(max: number) {
        maxConnections = max;
    }
};
