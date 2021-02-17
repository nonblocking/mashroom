
import MiddlewarePluginDelegate from '../../src/server/MiddlewarePluginDelegate';

import type {NextFunction, Request, Response} from 'express';

describe('MiddlewarePluginDelegate', () => {

    it('inserts new middleware at the correct stack position', () => {
        const middleware1: any = {foo: 1};
        const middleware2: any = {foo: 2};

        const middlewarePluginDelegate = new MiddlewarePluginDelegate();
        middlewarePluginDelegate.insertOrReplaceMiddleware('one', 10, middleware1);
        middlewarePluginDelegate.insertOrReplaceMiddleware('two', -10, middleware2);

        expect(middlewarePluginDelegate.middlewareStack.length).toBe(2);
        // @ts-ignore
        expect(middlewarePluginDelegate.middlewareStack[0].middleware.foo).toBe(2);
        // @ts-ignore
        expect(middlewarePluginDelegate.middlewareStack[1].middleware.foo).toBe(1);
    });

    it('replaces existing middleware with the same name', () => {
        const middleware1: any = { foo: 1 };

        const middlewarePluginDelegate = new MiddlewarePluginDelegate();
        middlewarePluginDelegate.insertOrReplaceMiddleware('one', 10, middleware1);
        middlewarePluginDelegate.insertOrReplaceMiddleware('one', -10, middleware1);

        expect(middlewarePluginDelegate.middlewareStack.length).toBe(1);
    });

    it('executes the middleware in the stack in the correct order', () => {
        const callstack: Array<any> = [];
        const middleware1 = (req: Request, res: Response, next: NextFunction) => {
            callstack.push('1');
            next();
        };
        const middleware2 = (req: Request, res: Response, next: NextFunction) => {
            callstack.push('2');
            next();
        };
        const middleware3 = (req: Request, res: Response, next: NextFunction) => {
            callstack.push('3');
            next();
        };

        const middlewarePluginDelegate = new MiddlewarePluginDelegate();
        middlewarePluginDelegate.insertOrReplaceMiddleware('one', 10, middleware1);
        middlewarePluginDelegate.insertOrReplaceMiddleware('two', -10, middleware2);
        middlewarePluginDelegate.insertOrReplaceMiddleware('three', 1000, middleware3);

        const req: any = {};
        const res: Response = {} as any;
        const next: NextFunction = () => {
            callstack.push('4');
        };

        const middleware = middlewarePluginDelegate.middleware();
        middleware(req, res, next);

        expect(callstack.length).toBe(4);
        expect(callstack[0]).toBe('2');
        expect(callstack[1]).toBe('1');
        expect(callstack[2]).toBe('3');
        expect(callstack[3]).toBe('4');
    });

});
