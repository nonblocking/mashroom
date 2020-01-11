// @flow

import type {
    MashroomLogger,
    MashroomLoggerFactory,
    GlobalNodeErrorHandler as GlobalNodeErrorHandlerType
} from '../../type-definitions';

let unhandledRejection = false;
let uncaughtException = false;

export const hasUnhandledRejection = () => unhandledRejection;
export const hasUncaughtException = () => uncaughtException;

export default class GlobalNodeErrorHandler implements GlobalNodeErrorHandlerType {

    _log: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._log = loggerFactory('mashroom.server');
    }

    install() {
        process.on('unhandledRejection', (error) => {
            unhandledRejection = true;
            this._log.error(`Unhandled promise rejection. This is usually a programming mistake. \nContinuing but server might not work as expected.`, error);
        });

        process.on('uncaughtException', (error) => {
            uncaughtException = true;
            this._log.error(`FATAL: Uncaught exception. This is usually a programming mistake. \nContinuing but server might not work as expected.`, error);
        });
    }

    uninstall() {
        process.removeAllListeners('unhandledRejection');
        process.removeAllListeners('uncaughtException');
    }

}
