
import {PORTAL_APP_API_PATH, PORTAL_INTERNAL_PATH, WINDOW_VAR_PORTAL_API_PATH} from '../../../backend/constants';
import {serializeError} from './serialization_utils';
import {HEADER_DO_NOT_EXTEND_SESSION} from './headers';

import type {LogLevel} from '@mashroom/mashroom/type-definitions';
import type {MasterMashroomPortalRemoteLogger, MashroomPortalRemoteLogger} from '../../../../type-definitions';
import type {ClientLogMessage, MashroomRestService} from '../../../../type-definitions/internal';

const SEND_INTERVAL = 2000;

export default class MashroomPortalRemoteLoggerImpl implements MasterMashroomPortalRemoteLogger {

    private _restService: MashroomRestService;
    private _unsentLogMessages: Array<ClientLogMessage>;
    private _timeout: ReturnType<typeof setTimeout> | null;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
        this._unsentLogMessages = [];
        this._timeout = null;
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

        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        this._timeout = setTimeout(this._send.bind(this), SEND_INTERVAL);
    }

    private _send() {
        this._timeout = null;

        let messages = [...this._unsentLogMessages];

        // Filter errors that occurred when sending previous logs failed
        messages = messages.filter(({ message }) => message?.indexOf(`${PORTAL_INTERNAL_PATH}${PORTAL_APP_API_PATH}/log`) === -1);

        if (messages.length === 0) {
            return;
        }

        try {
            this._restService.post('/log', messages, {
                [HEADER_DO_NOT_EXTEND_SESSION]: '1'
            }).catch(() => {
               // Catch and ignore all errors,
               // otherwise this will generate new log messages which will most probably fail again
            });
            this._unsentLogMessages = [];
        } catch (e) {
            console.error('Unable to send error message to server', e);
        }
    }


}
