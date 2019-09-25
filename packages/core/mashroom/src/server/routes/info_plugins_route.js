// @flow

import infoTemplate from './info_template';

import type {MashroomPluginContext, ExpressRequest, ExpressResponse} from '../../../type-definitions';

const pluginsRoute = (req: ExpressRequest, res: ExpressResponse) => {
    res.type('text/html');
    res.send(infoTemplate(plugins(req.pluginContext), req));
};

export default pluginsRoute;

const plugins = (pluginContext: MashroomPluginContext) => `
    <h2>Plugin Loaders</h2>
    ${pluginLoadersTable(pluginContext)}
    <h2>Plugin Packages</h2>
    ${pluginPackagesTable(pluginContext)}
    <h2>Plugins</h2>
    ${pluginTable(pluginContext)}         
`;

const pluginLoadersTable = (pluginContext: MashroomPluginContext) => {
    const pluginLoaderRows = [];

    const pluginLoaders = pluginContext.services.core.pluginService.getPluginLoaders();
    for (const loadsType in pluginLoaders) {
        if (pluginLoaders.hasOwnProperty(loadsType)) {
            pluginLoaderRows.push(`<tr><td>${pluginLoaders[loadsType].name}</td><td>${loadsType}</td></tr>`);
        }
    }

    return `<table><tr><th>Name</th><th>Loads</th></tr>${pluginLoaderRows.join('')}</table>`;
};

const pluginTable = (pluginContext: MashroomPluginContext) => {
    const pluginRows = [];

    pluginContext.services.core.pluginService.getPlugins().forEach((p) => {
        const config = p.config ? JSON.stringify(p.config, null, 2) : '-';
        const def = JSON.stringify(p.pluginDefinition, null, 2);
        const lastReload = p.lastReloadTs ? new Date(p.lastReloadTs).toLocaleString() : '';
        const errorMessage = p.errorMessage || '-';
        let statusStyle = '';
        if (p.status === 'loaded') statusStyle = 'color:green';
        if (p.status === 'error') statusStyle = 'color:red';
        pluginRows.push(`<tr><td>${p.name}</td><td>${p.type}</td><td>${p.pluginPackage.name}</td><td style="${statusStyle}">${p.status}</td><td>${errorMessage}</td><td>${lastReload}</td><td><pre>${def}</pre></td><td><pre>${config}</pre></td></tr>`);
    });

    return `<table><tr><th>Name</th><th>Type</th><th>Package</th><th>Status</th><th>Error</th><th>Last Reload</th><th>Definition</th><th>Config</th></tr>${pluginRows.join('')}</table>`;
};

const pluginPackagesTable = (pluginContext: MashroomPluginContext) => {
    const pluginPackagesRows = [];

    pluginContext.services.core.pluginService.getPluginPackages().forEach((pp) => {
        const errorMessage = pp.errorMessage || '-';
        const homepageLink = pp.homepage ? `<a target='_blank' href="${pp.homepage}">${pp.homepage}</a>` : '&nbsp;';
        pluginPackagesRows.push(`<tr><td>${pp.name}</td><td>${homepageLink}</td><td>${pp.license || '&nbsp;'}</td><td>${pp.version}</td><td>${pp.status}</td><td>${errorMessage}</td></tr>`);
    });

    return `<table><tr><th>Name</th><th>Homepage</th><th>License</th><th>Version</th><th>Status</th><th>Error</th></tr>${pluginPackagesRows.join('')}</table>`;
};
