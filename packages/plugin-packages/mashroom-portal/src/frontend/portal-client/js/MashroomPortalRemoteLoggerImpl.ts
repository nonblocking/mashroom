
import {WINDOW_VAR_PORTAL_API_PATH} from '../../../backend/constants';

import type {LogLevel} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalRemoteLogger, MashroomRestService} from '../../../../type-definitions';
import type {ClientLogMessage} from '../../../../type-definitions/internal';

const SEND_INTERVAL = 1000;

export default class MashroomPortalRemoteLoggerImpl implements MashroomPortalRemoteLogger {

    private restService: MashroomRestService;
    private unsentLogMessages: Array<ClientLogMessage>;
    private timeout: ReturnType<typeof setTimeout> | null;

    constructor(restService: MashroomRestService) {
        const apiPath = (global as any)[WINDOW_VAR_PORTAL_API_PATH];
        this.restService = restService.withBasePath(apiPath);
        this.unsentLogMessages = [];
        this.timeout = null;
    }

    error(msg: string, error?: Error, portalAppName?: string | undefined | null) {
        this.log('error', msg, error, portalAppName);
    }

    warn(msg: string, error?: Error, portalAppName?: string | undefined | null) {
        this.log('warn', msg, error, portalAppName);
    }

    getAppInstance(portalAppName: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
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

    private log(level: LogLevel, message: string, error?: Error | string, portalAppName?: string | undefined | null) {
        if (error) {
            const serializedError = typeof (error) === 'string' ? error : this.serializeError(error);
            message = `${message}\n${serializedError}`;
        }

        const logMessage: ClientLogMessage = {
            level,
            portalAppName,
            message
        };

        this.unsentLogMessages.push(logMessage);

        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        setTimeout(this.send.bind(this), SEND_INTERVAL);
    }

    private send() {
        this.timeout = null;

        const messages = [...this.unsentLogMessages];
        if (messages.length === 0) {
            return;
        }

        try {
            this.restService.post('/log', messages);
        } catch (e) {
            console.error('Unable to send error message to server', e);
        }
    }

    private serializeError(error: Error) {
        const msg = JSON.stringify({...error}, null, 2);
        return msg.replace(/\\n/g, '\n');
    }
}
