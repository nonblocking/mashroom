// @flow

import type {MashroomPortalRemoteLogger} from '../../../../type-definitions';
import {
    PORTAL_APP_RESOURCES_BASE_PATH,
    PORTAL_INTERNAL_PATH
} from '../../../backend/constants';

export default class BrowserErrorHandler {

    _remoteLogger: MashroomPortalRemoteLogger;

    constructor(remoteLogger: MashroomPortalRemoteLogger) {
        this._remoteLogger = remoteLogger;
    }

    install() {
        window.onerror = (event: string, source: ?string, fileno: ?number, columnNumber: ?number, error?: Error) => {
            let portalAppName = null;
            if (source) {
                const match = source.match(`.*${PORTAL_INTERNAL_PATH}${PORTAL_APP_RESOURCES_BASE_PATH}/(.*)/.*`);
                if (match) {
                    portalAppName = decodeURIComponent(match[1]);
                }
            }

            const message = error ? error.message : event;

            this._remoteLogger.error(message, error, portalAppName);
        };
    }

}
