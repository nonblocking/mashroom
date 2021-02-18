
import MashroomPortalStateServiceImpl from '../../../src/frontend/portal-client/js/MashroomPortalStateServiceImpl';

// Node doesn't provide btoa() and atob() like browsers
const btoa = (s: string) => Buffer.from(s).toString('base64');
const atob = (s: string) => Buffer.from(s, 'base64').toString();
global.btoa = btoa;
global.atob = atob;

describe('MashroomPortalStateServiceImpl', () => {

    it('extracts the state from the URL', () => {
        // @ts-ignore
        global.location = {
            search: `?test=1&mrps=${btoa(JSON.stringify({foo: 'bar', x: 3}))}`,
        };

        const stateService = new MashroomPortalStateServiceImpl();

        expect(stateService.getStateProperty('test')).toBe('1');
        expect(stateService.getStateProperty('foo')).toBe('bar');
        expect(stateService.getStateProperty('x')).toBe(3);
    });

    it('encodes state into an URL', () => {
        // @ts-ignore
        global.location = {
            host: 'www.mashroom-server-com',
            protocol: 'https:',
            hash: '#foo',
            search: `?test=1`,
        };

        const stateService = new MashroomPortalStateServiceImpl();

        const state = {
            foo: 'bar',
            x: 2,
        };
        const url = stateService.encodeStateIntoUrl('https://www.mashroom-server-com', state, {test: '1'}, 'foo');

        expect(url).toBe('https://www.mashroom-server-com?mrps=eyJmb28iOiJiYXIiLCJ4IjoyfQ==&test=1#foo');
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
