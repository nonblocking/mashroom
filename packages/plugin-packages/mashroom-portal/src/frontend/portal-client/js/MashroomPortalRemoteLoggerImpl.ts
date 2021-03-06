
import {WINDOW_VAR_PORTAL_API_PATH} from '../../../backend/constants';

import type {LogLevel} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomRestService,
    MasterMashroomPortalRemoteLogger
} from '../../../../type-definitions';
import type {ClientLogMessage} from '../../../../type-definitions/internal';

const SEND_INTERVAL = 1000;

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

    error(msg: string, error?: Error, portalAppName?: string | null | undefined) {
        this._log('error', msg, error, portalAppName);
    }

    warn(msg: string, error?: Error, portalAppName?: string | null | undefined) {
        this._log('warn', msg, error, portalAppName);
    }

    info(msg: string, portalAppName?: string | null | undefined) {
        this._log('info', msg, undefined, portalAppName);
    }

    getAppInstance(portalAppName: string) {
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
        }
    }

    private _log(level: LogLevel, message: string, error?: Error | string, portalAppName?: string | undefined | null) {
        if (error) {
            const serializedError = typeof (error) === 'string' ? error : this._serializeError(error);
            message = `${message}\n${serializedError}`;
        }

        const logMessage: ClientLogMessage = {
            level,
            portalAppName,
            message
        };

        this._unsentLogMessages.push(logMessage);

        if (this._timeout) {
            clearTimeout(this._timeout);
        }
        setTimeout(this._send.bind(this), SEND_INTERVAL);
    }

    private _send() {
        this._timeout = null;

        const messages = [...this._unsentLogMessages];
        if (messages.length === 0) {
            return;
        }

        try {
            this._restService.post('/log', messages);
        } catch (e) {
            console.error('Unable to send error message to server', e);
        }
    }

    private _serializeError(error: any) {
        const errorObj: any = {};
        Object.getOwnPropertyNames(error).forEach((key) => {
            errorObj[key] = error[key];
        }, this);
        const msg = JSON.stringify(errorObj, null, 2);
        return msg.replace(/\\n/g, '\n');
    }
}
