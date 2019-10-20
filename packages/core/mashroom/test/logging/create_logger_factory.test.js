// @flow

import GlobalLoggerContext from '../../src/logging/context/GlobalLoggerContext';
import createLoggerFactory from '../../src/logging/create_logger_factory';

import type {LogLevel, MashroomLoggerDelegate} from '../../type-definitions';

describe('logger_factory', () => {

    const delegate: MashroomLoggerDelegate = {
        init(serverRootPath: string) {
            return Promise.resolve();
        },

        log(category: string, level: LogLevel, context: ?{}, message: string, ...args: any[]) {
        }
    };

    const loggerFactory = createLoggerFactory(delegate);

    it('creates by default logger instances without context', () => {
       const logger = loggerFactory('test.test');

       expect(() => logger.addContext({ a: 2 })).toThrowError('No logger context present. Please create a context logger with withContext()');
    });

    it('creates a context aware logger if bound to a context instance', () => {
        const context = new GlobalLoggerContext({ test: 'x' });
        const logger = loggerFactory.bindToContext(context)('test.test');

        logger.addContext({ a: 2 });

        expect(context.get()).toEqual({
            test: 'x',
            a: 2,
        });
    });

});
