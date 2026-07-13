
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
