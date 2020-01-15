// @flow

import {WINDOW_VAR_PORTAL_API_PATH} from '../../../backend/constants';

import type {LogLevel} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalRemoteLogger, MashroomRestService} from '../../../../type-definitions';
import type {ClientLogMessage} from '../../../../type-definitions/internal';

const SEND_INTERVAL = 1000;

export default class MashroomPortalRemoteLoggerImpl implements MashroomPortalRemoteLogger {

    _restService: MashroomRestService;
    _unsentLogMessages: Array<ClientLogMessage>;
    _timeout: ?TimeoutID;

    constructor(restService: MashroomRestService) {
        const apiPath = global[WINDOW_VAR_PORTAL_API_PATH];
        this._restService = restService.withBasePath(apiPath);
        this._unsentLogMessages = [];
        this._timeout = null;
    }

    error(msg: string, error?: Error, portalAppName: ?string) {
        this._log('error', msg, error, portalAppName);
    }

    warn(msg: string, error?: Error, portalAppName: ?string) {
        this._log('warn', msg, error, portalAppName);
    }

    getAppInstance(portalAppName: string) {
        const self = this;
        return {
            error(msg: string, error?: Error) {
                self.error(msg, error, portalAppName);
            },
            warn(msg: string, error?: Error) {
                self.error(msg, error, portalAppName);
            },
            getAppInstance() {
                throw Error('Not implemented');
            }
        }
    }

    _log(level: LogLevel, message: string, error?: Error | string, portalAppName: ?string) {
        if (error) {
            const serializedError = typeof (error) === 'string' ? error : this._serializeError(error);
            message = message + '\n' + serializedError;
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

    _send() {
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

    _serializeError(error: Error) {
        const msg = JSON.stringify(Object.assign({ message: error.message, stack: error.stack }, (error: any)), null, 2);
        return msg.replace(/\\n/g, '\n');
    }
}
