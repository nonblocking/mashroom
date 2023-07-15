
import {
    PORTAL_APP_RESOURCES_BASE_PATH,
    PORTAL_INTERNAL_PATH
} from '../../../backend/constants';
import {serializeObject} from './serialization_utils';

import type {MasterMashroomPortalRemoteLogger} from '../../../../type-definitions';

/**
 * Watches client errors and logs them on the server side
 */
export default class BrowserErrorHandler {

    constructor(private _remoteLogger: MasterMashroomPortalRemoteLogger) {
    }

    install(): void {
        // Handle errors
        global.addEventListener('error', (errorEvent) => {
            const {message, filename, error} = errorEvent;
            let portalAppName = undefined;
            if (filename) {
                portalAppName = getAppNameFromScript(filename);
            }

            this._remoteLogger.error(`Client error: ${message}`, error, portalAppName);
        });

        // Handle unhandled promise rejections
        global.addEventListener('unhandledrejection', (event) => {
            let portalAppName = undefined;
            if ('stack' in event.reason) {
                portalAppName = getAppNameFromScript(event.reason.stack);
            }

            const message = serializeObject(event.reason);
            this._remoteLogger.error(`Client error: Unhandled promise rejection: ${message}`, undefined, portalAppName);
        });

        // Handle console errors
        tapIntoConsoleLog('error', (portalAppName, args) => {
            const message = serializeObject(args.map((a) => serializeObject(a)).join(' '));
            this._remoteLogger.error(`Client Error: ${message}`, undefined, portalAppName);
        });
    }
}

const getAppNameFromScript = (source: string): string | undefined => {
    const match = source.match(`.*${PORTAL_INTERNAL_PATH}${PORTAL_APP_RESOURCES_BASE_PATH}/(.*?)/.*`);
    if (match) {
        return decodeURIComponent(match[1]);
    }
};

const tapIntoConsoleLog = (logType: 'error' | 'warn' | 'info', fn: (portalAppName: string | undefined, args: Array<any>) => void) => {
    const original = console[logType];
    console[logType] = function (...args: Array<any>) {
        // Try to detect the App which writes this error
        let portalAppName = undefined;
        const stack = new Error().stack?.split('\n').reverse();
        if (stack) {
            for (let i = 0; i < stack.length; i++) {
                portalAppName = getAppNameFromScript(stack[i]);
                if (portalAppName) {
                    break;
                }
            }
        }

        original.apply(console, args);
        fn(portalAppName, args);
    };
};
