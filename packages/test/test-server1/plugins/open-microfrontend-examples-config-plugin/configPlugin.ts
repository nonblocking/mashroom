import type {MashroomPortalAppConfigPlugin, MashroomPortalAppConfigPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const plugin1: MashroomPortalAppConfigPlugin = {
    applyTo(portalAppName: string): boolean {
        return ['OpenMicrofrontends Example API Proxy with Security', 'OpenMicrofrontends Example SSR'].includes(portalAppName);
    },
    overwriteProxyTargetUrl(portalApp, proxyId) {
        if (proxyId === 'chuckNorrisJoke') {
            return 'https://api.chucknorris.io/jokes/random';
        }
    },
    addProxyRequestHeaders(portalApp, proxyId) {
        if (proxyId === 'bff') {
            return {
                'x-api-key': '123456',
            };
        }
    },
    addSSRRouteRequestHeaders() {
        return {
            'x-api-key': '123456',
        };
    },
    async determineRolePermissions(portalApp) {
        const permissionsURL = new URL('/permissions', portalApp.packageUrl);
        const result = await fetch(permissionsURL.toString(), {
           headers: {
               'x-api-key': '123456',
           }
        });
        if (result.ok) {
            return result.json();
        }
        console.error('Error fetching permissions from', permissionsURL, ': ', result.statusText);
    }
};

const bootstrap: MashroomPortalAppConfigPluginBootstrapFunction = () => {
    return plugin1;
};

export default bootstrap;
