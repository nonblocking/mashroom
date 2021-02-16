
import type {MashroomPortalRemoteLogger} from '../../../../type-definitions';
import {
    PORTAL_APP_RESOURCES_BASE_PATH,
    PORTAL_INTERNAL_PATH
} from '../../../backend/constants';

export default class BrowserErrorHandler {

    constructor(private remoteLogger: MashroomPortalRemoteLogger) {
    }

    install(): void {
        global.onerror = (event: Event | string, source: string | undefined, fileno: number | undefined, columnNumber: number | undefined, error?: Error) => {
            let portalAppName = null;
            if (source) {
                const match = source.match(`.*${PORTAL_INTERNAL_PATH}${PORTAL_APP_RESOURCES_BASE_PATH}/(.*)/.*`);
                if (match) {
                    portalAppName = decodeURIComponent(match[1]);
                }
            }

            const message = error ? error.message : event.toString();

            this.remoteLogger.error(message, error, portalAppName);
        };
    }

}
