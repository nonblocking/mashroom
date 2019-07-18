// @flow

import type {MiddlewarePluginDelegate as MiddlewarePluginDelegateType, ExpressRequest, ExpressResponse, ExpressNextFunction, ExpressMiddleware} from '../../type-definitions';

type MiddlewareHolder = {
    +name: string,
    +middleware: ExpressMiddleware,
    +order: number,
}

export default class MiddlewarePluginDelegate implements MiddlewarePluginDelegateType {

    _middlewareStack: Array<MiddlewareHolder>;

    constructor() {
        this._middlewareStack = [];
    }

    insertOrReplaceMiddleware(name: string, order: number, middleware: ExpressMiddleware) {
        // Remove existing
        this.removeMiddleware(name);

        let inserted = false;

        const newMiddlewareStack: Array<MiddlewareHolder> = [];
        for (const existingMiddleware of this._middlewareStack) {
           if (!inserted && order < existingMiddleware.order) {
               newMiddlewareStack.push({
                   name,
                   middleware,
                   order,
               });
               inserted = true;
           }

           newMiddlewareStack.push(existingMiddleware);
        }
        if (!inserted) {
            newMiddlewareStack.push({
                name,
                middleware,
                order,
            });
        }

        this._middlewareStack = newMiddlewareStack;
    }

    removeMiddleware(name: string) {
        this._middlewareStack = this._middlewareStack.filter((ms) => ms.name !== name);
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

    get middlewareStack(): Array<ExpressMiddleware> {
        return Object.freeze(this._middlewareStack.map((ms) => ms.middleware));
    }

}
