// @flow

import session from 'express-session';
import context from '../context/global_context';

const PROVIDER_NAME_MEMORY = 'memory';

import type {MashroomSessionMiddleware as MashroomSessionMiddlewareType} from '../../type-definitions';
import type {ExpressRequest, ExpressResponse, ExpressNextFunction} from '@mashroom/mashroom/type-definitions';

export default class MashroomSessionMiddleware implements MashroomSessionMiddlewareType {

    _storeProviderName: string;
    _options: any;
    _currentStore: ?any;
    _sessionMiddleware: ?any;

    constructor(storeProviderName: string, options: any) {
        this._storeProviderName = storeProviderName;
        this._options = options;
    }

    middleware() {
        return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            const logger = req.pluginContext.loggerFactory('mashroom.session.middleware');

            if (this._storeProviderName === PROVIDER_NAME_MEMORY) {
                if (!this._sessionMiddleware) {
                    this._sessionMiddleware = session(this._options);
                }
            } else {
                const store = context.pluginRegistry.findProvider(this._storeProviderName);
                if (!this._sessionMiddleware || store !== this._currentStore) {
                    try {
                        if (store) {
                            const options = Object.assign({}, this._options, {
                                store,
                            });
                            logger.info('Enabling session with options: ', options);
                            this._sessionMiddleware = session(options);
                        } else {
                            logger.warn(`Cannot enable session middleware because the store provider is not loaded (yet): ${this._storeProviderName}`);
                        }
                    } catch (e) {
                        logger.error('Creating session middleware failed!', e);
                    }

                    this._currentStore = store;
                }
            }

            if (this._sessionMiddleware) {
                this._sessionMiddleware(req, res, next);

                // Add sessionID to log context
                logger.addContext({ sessionID: req.sessionID });

            } else {
                next();
            }
        };
    }

}
