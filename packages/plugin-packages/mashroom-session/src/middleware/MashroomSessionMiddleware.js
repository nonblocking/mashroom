// @flow

import session from 'express-session';
import context from '../context/global_context';

const PROVIDER_NAME_MEMORY = 'memory';

import type {MashroomSessionMiddleware as MashroomSessionMiddlewareType} from '../../type-definitions';
import type {MashroomLogger, MashroomLoggerFactory, ExpressRequest, ExpressResponse, ExpressNextFunction} from '@mashroom/mashroom/type-definitions';

export default class MashroomSessionMiddleware implements MashroomSessionMiddlewareType {

    _storeProviderName: string;
    _options: any;
    _currentStore: ?any;
    _sessionMiddleware: ?any;
    _logger: MashroomLogger;

    constructor(storeProviderName: string, options: any, loggerFactory: MashroomLoggerFactory) {
        this._storeProviderName = storeProviderName;
        this._options = options;
        this._logger = loggerFactory('mashroom.session.middleware');
    }

    middleware() {
        return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
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
                            this._logger.info('Enabling session with options: ', options);
                            this._sessionMiddleware = session(options);
                        } else {
                            this._logger.warn(`Cannot enable session middleware because the store provider is not loaded (yet): ${this._storeProviderName}`);
                        }
                    } catch (e) {
                        this._logger.error('Creating session middleware failed!', e);
                    }

                    this._currentStore = store;
                }
            }

            if (this._sessionMiddleware) {
                this._sessionMiddleware(req, res, next);
            } else {
                next();
            }
        };
    }

}
