// @flow

import MashroomLoggerFactory from '../../../src/logging/MashroomLoggerFactory';

import type {LogLevel, MashroomLoggerDelegate} from '../../../type-definitions';

describe('MashroomLoggerFactory', () => {

    let lastLogEntry = {};

    const delegate: MashroomLoggerDelegate = {
        init(serverRootPath: string) {
            return Promise.resolve();
        },

        log(category: string, level: LogLevel, context: ?{}, message: string, ...args: any[]) {
            lastLogEntry = {
                category,
                level,
                context,
                message,
                args
            };
        }
    };

    it('adds the correct default context', async () => {
        const factory = await new MashroomLoggerFactory(delegate).factory('');

        const logger = factory('test.test');

        logger.info('Just a message', 1, 2);

        expect(lastLogEntry.category).toBe('test.test');
        expect(lastLogEntry.message).toBe('Just a message');
        expect(lastLogEntry.context).toBeTruthy();
        const context: any = lastLogEntry.context;
        expect(context.hostname).toBeTruthy();
        expect(context.pid).toBeTruthy();
    });

    it('merges the context correctly', async () => {
        const factory = await new MashroomLoggerFactory(delegate).factory('');

        const logger = factory('test.test', { foo: 1, bar: 2 });

        const loggerWithContext = logger.withContext({ a: 'b' }).withContext({ c: 'd' });
        loggerWithContext.info('Just another message', 1, 2);

        expect(lastLogEntry.category).toBe('test.test');
        expect(lastLogEntry.message).toBe('Just another message');
        expect(lastLogEntry.context).toBeTruthy();
        const context: any = lastLogEntry.context;
        expect(context.hostname).toBeTruthy();
        expect(context.pid).toBeTruthy();
        expect(context.foo).toBeTruthy();
        expect(context.bar).toBeTruthy();
        expect(context.a).toBeTruthy();
        expect(context.c).toBeTruthy();
    });

});
