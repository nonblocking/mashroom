
import {WINDOW_VAR_PORTAL_API_PATH} from '../../../backend/constants';
import {serializeError} from './serialization_utils';
import {HEADER_DO_NOT_EXTEND_SESSION} from './headers';

import type {LogLevel} from '@mashroom/mashroom/type-definitions';
import type {MasterMashroomPortalRemoteLogger, MashroomPortalRemoteLogger} from '../../../../type-definitions';
import type {ClientLogMessage, MashroomRestService} from '../../../../type-definitions/internal';

const CSRF_TOKEN_META = document.querySelector('meta[name="csrf-token"]');
const CSRF_TOKEN = CSRF_TOKEN_META && CSRF_TOKEN_META.getAttribute('content');
const SEND_INTERVAL = 3000;

export default class MashroomPortalRemoteLoggerImpl implements MasterMashroomPortalRemoteLogger {

    private readonly _apiBasePath;
    private _restService: MashroomRestService;
    private _unsentLogMessages: Array<ClientLogMessage>;

    constructor(restService: MashroomRestService) {
        this._apiBasePath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(this._apiBasePath);
        this._unsentLogMessages = [];

        setInterval(() => this._send(), SEND_INTERVAL);
        // Make sure no logs get lost during unload
        global.addEventListener('beforeunload', () => {
            this._send(true);
        });
    }

    error(msg: string, error?: Error, portalAppName?: string | null | undefined): void {
        this._log('error', msg, error, portalAppName);
    }

    warn(msg: string, error?: Error, portalAppName?: string | null | undefined): void {
        this._log('warn', msg, error, portalAppName);
    }

    info(msg: string, portalAppName?: string | null | undefined): void {
        this._log('info', msg, undefined, portalAppName);
    }

    getAppInstance(portalAppName: string): MashroomPortalRemoteLogger {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const master = this;
        return {
            error(msg: string, error?: Error) {
                master.error(msg, error, portalAppName);
            },
            warn(msg: string, error?: Error) {
                master.warn(msg, error, portalAppName);
            },
            info(msg: string) {
                master.info(msg, portalAppName);
            }
        };
    }

    private _log(level: LogLevel, message: string, error?: Error | string, portalAppName?: string | undefined | null) {
        if (error) {
            const serializedError = typeof (error) === 'string' ? error : serializeError(error);
            message = `${message}\n${serializedError}`;
        }

        const logMessage: ClientLogMessage = {
            level,
            portalAppName,
            path: global.location.pathname,
            message
        };

        this._unsentLogMessages.push(logMessage);
    }

    private _send(unloadingPage = false) {
        let messages = [...this._unsentLogMessages];
        // Filter errors that occurred when sending previous logs failed
        messages = messages.filter(({ message }) => message?.indexOf(`${this._apiBasePath}/log`) === -1);
        if (messages.length === 0) {
            return;
        }

        try {
            if (!unloadingPage) {
                this._restService.post('/log', messages, {
                    [HEADER_DO_NOT_EXTEND_SESSION]: '1'
                }).catch(() => {
                    // Catch and ignore all errors,
                    // otherwise this will generate new log messages which will most probably fail again
                });
            } else {
                // In case the page is about to being unloaded we must use sendBean,
                // see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon?retiredLocale=de#description
                const data = new Blob([JSON.stringify(messages)], { type: 'application/json' });
                navigator.sendBeacon(`${this._apiBasePath}/log${CSRF_TOKEN ? `?csrfToken=${CSRF_TOKEN}` : ''}`, data);
            }
            this._unsentLogMessages = [];
        } catch (e) {
            console.error('Unable to send error message to server', e);
        }
    }


}
