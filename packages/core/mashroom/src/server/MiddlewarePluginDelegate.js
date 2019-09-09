// @flow

import type {
    MiddlewarePluginDelegate as MiddlewarePluginDelegateType,
    ExpressRequest,
    ExpressResponse,
    ExpressNextFunction,
    ExpressMiddleware,
    MiddlewareStackEntry
} from '../../type-definitions';

export default class MiddlewarePluginDelegate implements MiddlewarePluginDelegateType {

    _middlewareStack: Array<MiddlewareStackEntry>;

    constructor() {
        this._middlewareStack = [];
    }

    insertOrReplaceMiddleware(pluginName: string, order: number, middleware: ExpressMiddleware) {
        // Remove existing
        this.removeMiddleware(pluginName);

        let inserted = false;

        const newMiddlewareStack: Array<MiddlewareStackEntry> = [];
        for (const existingMiddleware of this._middlewareStack) {
           if (!inserted && order < existingMiddleware.order) {
               newMiddlewareStack.push({
                   pluginName,
                   middleware,
                   order,
               });
               inserted = true;
           }

           newMiddlewareStack.push(existingMiddleware);
        }
        if (!inserted) {
            newMiddlewareStack.push({
                pluginName,
                middleware,
                order,
            });
        }

        this._middlewareStack = newMiddlewareStack;
    }

    removeMiddleware(pluginName: string) {
        this._middlewareStack = this._middlewareStack.filter((ms) => ms.pluginName !== pluginName);
    }

    middleware(): ExpressMiddleware {
        return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            let currentNext: any = next;
            for (let i = this._middlewareStack.length -1; i >= 0; i--) {
                const existingMiddleware = this._middlewareStack[i];
                const middleware: ExpressMiddleware = existingMiddleware.middleware;
                currentNext = middleware.bind(middleware, req, res, currentNext);
            }

            currentNext();
        };
    }

    get middlewareStack(): Array<MiddlewareStackEntry> {
        return this._middlewareStack.map((me) => ({
            pluginName: me.pluginName,
            order: me.order,
            middleware: Object.freeze(me.middleware),
        }));
    }

}
