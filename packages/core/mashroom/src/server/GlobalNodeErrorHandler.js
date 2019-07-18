// @flow

import type {
    MashroomLogger,
    MashroomLoggerFactory,
    GlobalNodeErrorHandler as GlobalNodeErrorHandlerType
} from '../../type-definitions';

export default class GlobalNodeErrorHandler implements GlobalNodeErrorHandlerType {

    _log: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._log = loggerFactory('mashroom.server');
    }

    install() {
        process.on('unhandledRejection', (error) => {
            this._log.error(`Unhandled promise rejection. This is usually a programming mistake. \nContinuing but server might not work as expected.`, error);
        });

        process.on('uncaughtException', (error) => {
            this._log.error(`FATAL: Uncaught exception. This is usually a programming mistake. \nContinuing but server might not work as expected.`, error);
        });
    }

    uninstall() {
        process.removeAllListeners('unhandledRejection');
        process.removeAllListeners('uncaughtException');
    }

}
