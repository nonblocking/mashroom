
import findHostDefinition from '../../src/utils/find_host_definition';

import type {DeterminedHost, VHostDefinitions} from '../../type-definitions/internal';

describe('find_host_definition', () => {

    it('returns undefined for empty definitions', () => {
        const host: DeterminedHost = {
            hostname: 'localhost',
            port: undefined,
        };
        const hostDefinitions: VHostDefinitions = {};

        expect(findHostDefinition(host, hostDefinitions)).toBeFalsy();
    });

    it('finds a host without port', () => {
        const host: DeterminedHost = {
            hostname: 'www.my-company.de',
            port: undefined,
        };
        const hostDefinitions: VHostDefinitions = {
            'localhost:8080': {
                mapping: {
                    '/foo': '/bar',
                },
            },
            'www.my-company.de': {
                mapping: {
                    '/': '/test',
                },
            },
        };

        expect(findHostDefinition(host, hostDefinitions)).toEqual({
            mapping: {
                '/': '/test',
            },
        });
    });

    it('finds a host with port', () => {
        const host: DeterminedHost = {
            hostname: 'localhost',
            port: '8080',
        };
        const hostDefinitions: VHostDefinitions = {
            'localhost:8080': {
                mapping: {
                    '/foo': '/bar',
                },
            },
            'www.my-company.de': {
                mapping: {
                    '/': '/test',
                },
            },
        };

        expect(findHostDefinition(host, hostDefinitions)).toEqual({
            mapping: {
                '/foo': '/bar',
            },
        });
    });

    it('ignores hosts when the port doesnt match', () => {
        const host1: DeterminedHost = {
            hostname: 'localhost',
            port: undefined,
        };
        const host2: DeterminedHost = {
            hostname: 'localhost',
            port: '8081',
        };
        const hostDefinitions: VHostDefinitions = {
            'localhost:8080': {
                mapping: {
                    '/foo': '/bar',
                },
            },
            'www.my-company.de': {
                mapping: {
                    '/': '/test',
                },
            },
        };

        expect(findHostDefinition(host1, hostDefinitions)).toBeFalsy();
        expect(findHostDefinition(host2, hostDefinitions)).toBeFalsy();
    });


});


