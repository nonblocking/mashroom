// @flow

import type {
    ExpressRequest, ExpressResponse, MashroomLogger, MashroomLoggerFactory,
    MashroomMiddlewareStackService as MashroomMiddlewareStackServiceType,
} from '../../type-definitions';
import type {
    MiddlewarePluginDelegate,
} from '../../type-definitions/internal';

const privatePropsMap: WeakMap<MashroomMiddlewareStackService, {
    middlewarePluginDelegate: MiddlewarePluginDelegate;
}> = new WeakMap();

export default class MashroomMiddlewareStackService implements MashroomMiddlewareStackServiceType {

    _log: MashroomLogger;

    constructor(middlewarePluginDelegate: MiddlewarePluginDelegate, loggerFactory: MashroomLoggerFactory) {
        privatePropsMap.set(this, {
            middlewarePluginDelegate
        });
        this._log = loggerFactory('mashroom.middleware.service');
    }

    has(pluginName: string) {
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return !!privateProps.middlewarePluginDelegate.middlewareStack.find((me) => me.pluginName === pluginName);
        }
        return false;
    }

    async apply(pluginName: string, req: ExpressRequest, res: ExpressResponse) {
        const privateProps = privatePropsMap.get(this);
        const middlewareEntry = privateProps && privateProps.middlewarePluginDelegate.middlewareStack.find((me) => me.pluginName === pluginName);
        if (!middlewareEntry) {
            throw new Error(`No middleware plugin '${pluginName} found!`);
        }

        this._log.debug(`Applying middleware: ${pluginName}`);
        return new Promise((resolve, reject) => {
            try {
                middlewareEntry.middleware(req, res, () => {
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    getStack(): Array<{ pluginName: string, order: number }> {
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return privateProps.middlewarePluginDelegate.middlewareStack.map((me) => ({
                pluginName: me.pluginName,
                order: me.order,
            }));
        }
        return [];
    }
}
