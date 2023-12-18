
import {safeEvaluateStringTemplate, evaluateTemplatesInConfigObject} from '../src/config-utils';

describe('config_utils.safeEvaluateStringTemplate', () => {

    it('evaluates a dynamic string template', () => {
        const template = 'Hello ${name ? name.toString() : "??"}!';
        const context = {
            name: 'John',
        };

        expect(safeEvaluateStringTemplate(template, context)).toBe('Hello John!');
    });

    it('evaluates multiple dynamic string template', () => {
        const template = '${greeting} ${name}!';
        const context = {
            name: 'John',
            greeting: 'Hello',
        };

        expect(safeEvaluateStringTemplate(template, context)).toBe('Hello John!');
    });

    it('does not evaluate a template that tries to access some global variable', () => {
        const template = 'Hello ${name}! And now die! ${true && process.exit()}';
        const context = {
            name: 'John',
        };

        expect(() => safeEvaluateStringTemplate(template, context)).toThrowError('Template tries to access global objects: Hello ${name}! And now die! ${true && process.exit()}');
    });

    it('ignores no template strings', () => {
        const template = 'Hello Melissa!';
        expect(safeEvaluateStringTemplate(template, {})).toBe('Hello Melissa!');
    });

});

describe('config_utils.evaluateTemplatesInConfigObject', () => {

    it('evaluates templates recursively in a config object', () => {

        const config = {
            name: '${env.SERVER_NAME}',
            port: 5050,
            xPowerByHeader: 'Powered by ${env.SERVER_NAME}',
            serverRootFolder: '.',
            tmpFolder: '/temp',
            plugins: {
                'My Plugin': {
                    profile: '${env.NODE_ENV}-profile'
                }
            }
        };

        process.env.SERVER_NAME = 'MyServer';

        const logger: any = console;
        evaluateTemplatesInConfigObject(config, logger);

        expect(config).toEqual({
            name: 'MyServer',
            port: 5050,
            xPowerByHeader: 'Powered by MyServer',
            serverRootFolder: '.',
            tmpFolder: '/temp',
            plugins: {
                'My Plugin': {
                    profile: 'test-profile'
                }
            }
        });
    });

});
