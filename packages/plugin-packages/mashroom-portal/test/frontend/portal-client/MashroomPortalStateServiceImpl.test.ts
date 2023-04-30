
import MashroomPortalStateServiceImpl from '../../../src/frontend/portal-client/js/MashroomPortalStateServiceImpl';

describe('MashroomPortalStateServiceImpl', () => {

    it('extracts the state from the URL', () => {
        // @ts-ignore
        global.location = {
            search: `?test=1&mrps=${btoa(JSON.stringify({foo: 'bar', x: 3}))}`,
        };
        // @ts-ignore
        global.sessionStorage = {
            getItem: (key: string) => key === 'ss' ? 'xyz' : null,
        };
        // @ts-ignore
        global.localStorage = {
            getItem: (key: string) => key === 'ls' ? 'xyz' : null,
        };

        const stateService = new MashroomPortalStateServiceImpl();

        expect(stateService.getStateProperty('test')).toBe('1');
        expect(stateService.getStateProperty('foo')).toBe('bar');
        expect(stateService.getStateProperty('x')).toBe(3);
        expect(stateService.getStateProperty('ss')).toBe('xyz');
        expect(stateService.getStateProperty('ls')).toBe('xyz');
    });

    it('updates the state in the URL', () => {
        // @ts-ignore
        global.location = {
            host: 'www.mashroom-server-com',
            protocol: 'https:',
            pathname: '/test',
            hash: '#foo',
            search: `?test=1&mrps=${btoa(JSON.stringify({foo: 'bar', x: 3}))}`,
        };
        let pushedUrl = null;
        // @ts-ignore
        global.history = {
            pushState(state, title, url) {
                pushedUrl = url;
            },
        };

        const stateService = new MashroomPortalStateServiceImpl();

        stateService.setUrlStateProperty('bar', {y: 5});

        expect(pushedUrl).toBe('https://www.mashroom-server-com/test?mrps=eyJmb28iOiJiYXIiLCJ4IjozLCJiYXIiOnsieSI6NX19&test=1#foo');
    });

});
