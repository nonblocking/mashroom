
import {promisify} from 'util';
import session, {MemoryStore} from 'express-session';
import context from '../context/global_context';
import type {SessionOptions, Store} from 'express-session';

import type {RequestHandler, Request, Response, NextFunction} from 'express';
import type {MashroomSessionMiddleware as MashroomSessionMiddlewareType} from '../../type-definitions/internal';

const PROVIDER_NAME_BUILT_IN_MEMORY = 'memory';
let currentStore: Store | MemoryStore | null | undefined;

export const getSessionCount = async (): Promise<number | null | undefined> => {
    if (currentStore && currentStore.length) {
        return promisify(currentStore.length).apply(currentStore);
    }
    return undefined;
};

export default class MashroomSessionMiddleware implements MashroomSessionMiddlewareType {

    private _sessionMiddleware: RequestHandler | undefined;

    constructor(private _storeProviderName: string, private _options: SessionOptions) {
    }

    middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            const logger = req.pluginContext.loggerFactory('mashroom.session.middleware');

            const storePluginChanged = this._storeProviderName !== PROVIDER_NAME_BUILT_IN_MEMORY &&
                currentStore !== context.pluginRegistry.findProvider(this._storeProviderName);

            if (!this._sessionMiddleware || storePluginChanged) {
                let store;
                if (this._storeProviderName === PROVIDER_NAME_BUILT_IN_MEMORY) {
                    store = new MemoryStore();
                } else {
                    store = context.pluginRegistry.findProvider(this._storeProviderName);
                }

                try {
                    if (store) {
                        const options = {...this._options, store,};
                        logger.info(`Enabling session with provider ${this._storeProviderName} and options:`, this._options);
                        this._sessionMiddleware = session(options);
                    } else {
                        logger.warn(`Cannot enable session middleware because the store provider is not loaded (yet): ${this._storeProviderName}`);
                    }
                } catch (e) {
                    logger.error('Creating session middleware failed!', e);
                }

                currentStore = store;
            }

            if (this._sessionMiddleware) {
                this._sessionMiddleware(req, res, next);

                // Add sessionID to log context
                logger.addContext({sessionID: req.sessionID});

            } else {
                next();
            }
        };
    }

}
