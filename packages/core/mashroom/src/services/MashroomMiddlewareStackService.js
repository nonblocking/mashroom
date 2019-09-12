// @flow

import type {
    ExpressRequest, ExpressResponse,
    MashroomMiddlewareStackService as MashroomMiddlewareStackServiceType,
    MiddlewarePluginDelegate
} from '../../type-definitions';

export default class MashroomMiddlewareStackService implements MashroomMiddlewareStackServiceType {

    _getMiddlewarePluginDelegate: MiddlewarePluginDelegate;

    constructor(middlewarePluginDelegate: MiddlewarePluginDelegate) {
        this._getMiddlewarePluginDelegate = middlewarePluginDelegate;
    }

    has(pluginName: string) {
        return !!this._getMiddlewarePluginDelegate.middlewareStack.find((me) => me.pluginName === pluginName);
    }

    async apply(pluginName: string, req: ExpressRequest, res: ExpressResponse) {
        const middlewareEntry = this._getMiddlewarePluginDelegate.middlewareStack.find((me) => me.pluginName === pluginName);
        if (!middlewareEntry) {
            throw new Error(`No middleware plugin '${pluginName} found!`);
        }

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
        return this._getMiddlewarePluginDelegate.middlewareStack.map((me) => ({
            pluginName: me.pluginName,
            order: me.order,
        }));
    }
}
