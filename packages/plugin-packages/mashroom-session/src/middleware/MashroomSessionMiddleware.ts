
import {promisify} from 'util';
import type {SessionOptions, Store} from 'express-session';
import session, {MemoryStore} from 'express-session';
import context from '../context/global_context';

import type {RequestHandler} from 'express';
import type {MashroomSessionMiddleware as MashroomSessionMiddlewareType} from '../../type-definitions/internal';
import type {ExpressNextFunction, ExpressRequest, ExpressResponse,} from '@mashroom/mashroom/type-definitions';

const PROVIDER_NAME_BUILT_IN_MEMORY = 'memory';
let currentStore: Store | MemoryStore | null | undefined;

export const getSessionCount = async (): Promise<number | null | undefined> => {
    if (currentStore && currentStore.length) {
        return promisify(currentStore.length).apply(currentStore);
    }
    return undefined;
};

export const clearSessions = async (): Promise<void> => {
    if (currentStore && currentStore.clear) {
        await promisify(currentStore.clear).apply(currentStore);
    }
};

export default class MashroomSessionMiddleware implements MashroomSessionMiddlewareType {

    private sessionMiddleware: RequestHandler | undefined;

    constructor(private storeProviderName: string, private options: SessionOptions) {
    }

    middleware() {
        return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            const logger = req.pluginContext.loggerFactory('mashroom.session.middleware');

            const storePluginChanged = this.storeProviderName !== PROVIDER_NAME_BUILT_IN_MEMORY &&
                currentStore !== context.pluginRegistry.findProvider(this.storeProviderName);

            if (!this.sessionMiddleware || storePluginChanged) {
                let store;
                if (this.storeProviderName === PROVIDER_NAME_BUILT_IN_MEMORY) {
                    store = new MemoryStore();
                } else {
                    store = context.pluginRegistry.findProvider(this.storeProviderName);
                }

                try {
                    if (store) {
                        const options = {...this.options, store,};
                        logger.info(`Enabling session with provider ${this.storeProviderName} and options:`, this.options);
                        this.sessionMiddleware = session(options);
                    } else {
                        logger.warn(`Cannot enable session middleware because the store provider is not loaded (yet): ${this.storeProviderName}`);
                    }
                } catch (e) {
                    logger.error('Creating session middleware failed!', e);
                }

                currentStore = store;
            }

            if (this.sessionMiddleware) {
                this.sessionMiddleware(req, res, next);

                // Add sessionID to log context
                logger.addContext({sessionID: req.sessionID});

            } else {
                next();
            }
        };
    }

}
