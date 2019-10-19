// @flow

import createLoggerFactory from '../../src/logging/create_logger_factory';

import type {LogLevel, MashroomLoggerDelegate} from '../../type-definitions';

describe('create_logger_factory', () => {

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

    it('merges the context correctly', async () => {
        const factory = await createLoggerFactory('', delegate);

        const logger = factory('test.test');

        const loggerWithContext = logger.withContext({ a: 'b' }).withContext({ c: 'd' });
        loggerWithContext.info('Just another message', 1, 2);

        expect(lastLogEntry.category).toBe('test.test');
        expect(lastLogEntry.message).toBe('Just another message');
        expect(lastLogEntry.context).toBeTruthy();
        const context: any = lastLogEntry.context;
        expect(context.a).toBeTruthy();
        expect(context.c).toBeTruthy();
    });

});
