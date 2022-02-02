import mapPath from '../../src/utils/map_path';

import type {VHostDefinition} from '../../type-definitions/internal';

describe('map_path', () => {

    it('does nothing for empty mapping rules', () => {
        const hostDefinition: VHostDefinition = {
            mapping: {}
        };

        expect(mapPath('/foo', hostDefinition)).toBeFalsy();
    });

    it('maps the path if a rule matches exactly', () => {
        const hostDefinition: VHostDefinition = {
            mapping: {
                '/test': '/tset',
                '/foo': '/bar',
            },
        };

        expect(mapPath('/foo?x=1', hostDefinition)).toEqual({
            url: '/bar?x=1',
            info: {
                mappingRuleBasePath: '/foo',
                originalUrl: '/foo?x=1',
                frontendBasePath: '/',
                frontendPath: '/foo',
                frontendUrl: '/foo?x=1',
            },
        });
    });

    it('maps the path if a rule matches the base path', () => {
        const hostDefinition: VHostDefinition = {
            frontendBasePath: '/web',
            mapping: {
                '/test': '/tset',
                '/foo': '/bar',
            },
        };

        expect(mapPath('/foo/xxx/1', hostDefinition)).toEqual({
            url: '/bar/xxx/1',
            info: {
                mappingRuleBasePath: '/foo',
                originalUrl: '/foo/xxx/1',
                frontendBasePath: '/web',
                frontendPath: '/web/foo/xxx/1',
                frontendUrl: '/web/foo/xxx/1',
            },
        });
    });

    it('maps the root path correctly', () => {
        const hostDefinition: VHostDefinition = {
            mapping: {
                '/test': '/tset',
                '/foo': '/bar',
                '/': '/end',
            },
        };

        expect(mapPath('/', hostDefinition)).toEqual({
            url: '/end',
            info: {
                mappingRuleBasePath: '/',
                originalUrl: '/',
                frontendBasePath: '/',
                frontendPath: '/',
                frontendUrl: '/',
            },
        });
        expect(mapPath('/?foo=x', hostDefinition)).toEqual({
            url: '/end?foo=x',
            info: {
                mappingRuleBasePath: '/',
                originalUrl: '/?foo=x',
                frontendBasePath: '/',
                frontendPath: '/',
                frontendUrl: '/?foo=x',
            },
        });
        expect(mapPath('/whatever/it/is?x=1', hostDefinition)).toEqual({
            url: '/end/whatever/it/is?x=1',
            info: {
                mappingRuleBasePath: '/',
                originalUrl: '/whatever/it/is?x=1',
                frontendBasePath: '/',
                frontendPath: '/whatever/it/is',
                frontendUrl: '/whatever/it/is?x=1',
            },
        });
    });

    it('executes only a single rule', () => {
        const hostDefinition: VHostDefinition = {
            mapping: {
                '/test': '/foo',
                '/foo/2': '/bar',
            },
        };

        expect(mapPath('/test/2', hostDefinition)).toEqual({
            url: '/foo/2',
            info: {
                mappingRuleBasePath: '/test',
                originalUrl: '/test/2',
                frontendBasePath: '/',
                frontendPath: '/test/2',
                frontendUrl: '/test/2',
            },
        });
    });

    it('maps location header', () => {
        const hostDefinition: VHostDefinition = {
            mapping: {
                '/test': '/foo',
                '/foo/2': '/bar'
            },
        };

        expect(mapPath('/bar/foo', hostDefinition, true)).toEqual({
            url: '/foo/2/foo',
            info: {
                mappingRuleBasePath: '/foo/2',
                originalUrl: '/bar/foo',
                frontendBasePath: '/',
                frontendPath: '/foo/2/foo',
                frontendUrl: '/foo/2/foo',
            },
        });
    });

    it('maps location header when target is root', () => {
        const hostDefinition: VHostDefinition = {
            mapping: {
                '/test': '/foo',
                '/': '/bar'
            },
        };

        expect(mapPath('/bar/foo', hostDefinition, true)).toEqual({
            url: '/foo',
            info: {
                mappingRuleBasePath: '/',
                originalUrl: '/bar/foo',
                frontendBasePath: '/',
                frontendPath: '/foo',
                frontendUrl: '/foo',
            },
        });
    });

    it('maps location header with frontendPath', () => {
        const hostDefinition: VHostDefinition = {
            frontendBasePath: '/web',
            mapping: {
                '/test': '/foo',
                '/foo/2': '/bar'
            },
        };

        expect(mapPath('/bar/foo', hostDefinition, true)).toEqual({
            url: '/web/foo/2/foo',
            info: {
                mappingRuleBasePath: '/foo/2',
                originalUrl: '/bar/foo',
                frontendBasePath: '/web',
                frontendPath: '/web/foo/2/foo',
                frontendUrl: '/web/foo/2/foo',
            },
        });
    });

});


