
import MashroomPortalPluginRegistry from '../../../src/backend/plugins/MashroomPortalPluginRegistry';

describe('MashroomPortalPluginRegistry', () => {

    it('registers a portal app', () => {
        const portalApp: any = {name: 'app'};

        const registry = new MashroomPortalPluginRegistry();
        registry.registerPortalApp(portalApp);

        expect(registry.portalApps.length).toBe(1);
    });

    it('replaces a portal app', () => {
        const portalApp1: any = {name: 'app', category: '1'};
        const portalApp2: any = {name: 'app', category: '2'};

        const registry = new MashroomPortalPluginRegistry();
        registry.registerPortalApp(portalApp1);
        registry.registerPortalApp(portalApp2);

        expect(registry.portalApps.length).toBe(1);
        expect(registry.portalApps[0].category).toBe('2');
    });

    it('unregisters a portal app', () => {
        const portalApp: any = {name: 'app'};

        const registry = new MashroomPortalPluginRegistry();
        registry.registerPortalApp(portalApp);
        registry.unregisterPortalApp('app');

        expect(registry.portalApps.length).toBe(0);
    });

    it('merges portal apps from an app registry correctly', () => {
        const portalApp: any = {name: 'app1', source: 'local'};
        const portalApp2: any = {name: 'app2', source: 'local'};
        const remotePortalApp1: any = {name: 'app2', source: 'remote1'};
        const remotePortalApp2: any = {name: 'app2', source: 'remote2'};
        const remotePortalApp3: any = {name: 'app2', source: 'remote3'};
        const remotePortalApp4: any = {name: 'app1', source: 'remote3'};

        const registry = new MashroomPortalPluginRegistry();
        registry.registerPortalApp(portalApp);
        registry.registerPortalApp(portalApp2);

        registry.registerPortalAppRegistry({
            name: 'remote1',
            priority: 1,
            registry: {
                portalApps: [remotePortalApp1]
            }
        });
        registry.registerPortalAppRegistry({
            name: 'remote2',
            priority: 100,
            registry: {
                portalApps: [remotePortalApp2]
            }
        });
        registry.registerPortalAppRegistry({
            name: 'remote3',
            priority: -1,
            registry: {
                portalApps: [remotePortalApp3, remotePortalApp4]
            }
        });

        expect(registry.portalApps.length).toBe(2);
        const app1: any = registry.portalApps.find((app) => app.name === 'app1');
        expect(app1).toBeTruthy();
        expect(app1.source).toBe('local');
        const app2: any = registry.portalApps.find((app) => app.name === 'app2');
        expect(app2).toBeTruthy();
        expect(app2.source).toBe('remote2');
    });

    it('registers a theme', () => {
        const theme: any = {name: 'theme'};

        const registry = new MashroomPortalPluginRegistry();
        registry.registerTheme(theme);

        expect(registry.themes.length).toBe(1);
    });

    it('replaces a theme', () => {
        const theme1: any = {name: 'theme', description: '1'};
        const theme2: any = {name: 'theme', description: '2'};

        const registry = new MashroomPortalPluginRegistry();
        registry.registerTheme(theme1);
        registry.registerTheme(theme2);

        expect(registry.themes.length).toBe(1);
        expect(registry.themes[0].description).toBe('2');
    });

    it('unregisters a theme', () => {
        const theme: any = {name: 'theme'};

        const registry = new MashroomPortalPluginRegistry();
        registry.registerTheme(theme);
        registry.unregisterTheme('theme');

        expect(registry.themes.length).toBe(0);
    });

    it('registers a layout', () => {
        const layout: any = {name: 'layout'};

        const registry = new MashroomPortalPluginRegistry();
        registry.registerLayout(layout);

        expect(registry.layouts.length).toBe(1);
    });

});
