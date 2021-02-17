
import type {
    MashroomLogger,
    MashroomLoggerFactory
} from '../../type-definitions';
import type {
    GlobalNodeErrorHandler as GlobalNodeErrorHandlerType
} from '../../type-definitions/internal';

let unhandledRejection = false;
let uncaughtException = false;

export const hasUnhandledRejection = () => unhandledRejection;
export const hasUncaughtException = () => uncaughtException;

export default class GlobalNodeErrorHandler implements GlobalNodeErrorHandlerType {

    _logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.server');
    }

    install() {
        process.on('unhandledRejection', (error) => {
            unhandledRejection = true;
            this._logger.error(`Unhandled promise rejection. This is usually a programming mistake. \nContinuing but server might not work as expected.`, error);
        });

        process.on('uncaughtException', (error) => {
            uncaughtException = true;
            this._logger.error(`FATAL: Uncaught exception. This is usually a programming mistake. \nContinuing but server might not work as expected.`, error);
        });
    }

    uninstall() {
        process.removeAllListeners('unhandledRejection');
        process.removeAllListeners('uncaughtException');
    }

}
