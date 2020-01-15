// @flow

import MashroomLogger from '../../src/logging/MashroomLogger';

import type {LogLevel} from '../../type-definitions';
import type {MashroomLoggerDelegate} from '../../type-definitions/internal';

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

    it('adds context items', async () => {
        const logger = new MashroomLogger('test.test', null, delegate);
        const ctxLogger = logger.withContext({ a: 'b' });
        ctxLogger.addContext({ c: 'd' });

        ctxLogger.info('Just another message', 1, 2);

        expect(lastLogEntry.category).toBe('test.test');
        expect(lastLogEntry.message).toBe('Just another message');
        expect(lastLogEntry.context).toBeTruthy();
        const context: any = lastLogEntry.context;
        expect(context.a).toBeTruthy();
        expect(context.c).toBeTruthy();
    });

    it('keeps the contexts separated', async () => {
        const logger = new MashroomLogger('test.test', null, delegate);

        const ctxLogger1 = logger.withContext({ a: 'b' });
        const ctxLogger2 = logger.withContext({ x: 2 });

        ctxLogger2.info('Just another message', 1, 2);

        expect(lastLogEntry.category).toBe('test.test');
        expect(lastLogEntry.message).toBe('Just another message');
        expect(lastLogEntry.context).toBeTruthy();
        const context: any = lastLogEntry.context;
        expect(context.a).toBeFalsy();
        expect(context.x).toBeTruthy();
    });

    it('clones the context', async () => {
        const logger = new MashroomLogger('test.test', null, delegate);
        const ctxLogger = logger.withContext({ a: 'b' });
        ctxLogger.addContext({ c: 'd' });
        const ctxLogger2 = ctxLogger.withContext({ d: 'c' });

        ctxLogger2.info('Just another message', 1, 2);

        expect(lastLogEntry.category).toBe('test.test');
        expect(lastLogEntry.message).toBe('Just another message');
        expect(lastLogEntry.context).toBeTruthy();
        const context: any = lastLogEntry.context;
        expect(context.a).toBeTruthy();
        expect(context.d).toBeTruthy();
    });

});
