// @flow

import infoTemplate from './template';
import escapeHtml from './escape_html';
import jsonToHtml from './json_to_html';

import type {MashroomPluginContext, ExpressRequest, ExpressResponse} from '../../../../../type-definitions';

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
            pluginLoaderRows.push(`
                <tr>
                    <td>${pluginLoaders[loadsType].name}</td>
                    <td>${loadsType}</td>
                </tr>
            `);
        }
    }

    return `
        <table>
            <tr>
                <th>Name</th>
                <th>Loads</th>
            </tr>
            ${pluginLoaderRows.join('')}
        </table>
    `;
};

const pluginPackagesTable = (pluginContext: MashroomPluginContext) => {
    const pluginPackagesRows = [];

    pluginContext.services.core.pluginService.getPluginPackages().forEach((pp) => {
        const homepageLink = pp.homepage ? `<a target='_blank' href="${pp.homepage}">${pp.homepage}</a>` : '';
        let statusStyle = '';
        let rowBackgroundStyle = '';
        if (pp.status === 'ready') {
            statusStyle = 'color:green';
        }
        if (pp.status === 'error') {
            statusStyle = 'color:red';
            rowBackgroundStyle = 'background-color:#FFDDDD';
        }
        pluginPackagesRows.push(`
            <tr style="${rowBackgroundStyle}">
                <td>${escapeHtml(pp.name)}</td>
                <td>${homepageLink}</td>
                <td>${escapeHtml(pp.author || '')}</td>
                <td>${pp.license || ''}</td>
                <td>${pp.version}</td>
                <td style="${statusStyle}">${pp.status}</td>
                <td>${escapeHtml(pp.errorMessage || '')}</td>
            </tr>`);
    });

    return `
        <table>
            <tr>
                <th>Name</th>
                <th>Homepage</th>
                <th>Author</th>
                <th>License</th>
                <th>Version</th>
                <th>Status</th>
                <th>Error</th>
            </tr>
            ${pluginPackagesRows.join('')}
        </table>
    `;
};

const pluginTable = (pluginContext: MashroomPluginContext) => {
    const pluginRows = [];

    pluginContext.services.core.pluginService.getPlugins().forEach((plugin, pluginIndex) => {
        const config = plugin.config ? jsonToHtml(plugin.config) : '&nbsp;';
        const def = jsonToHtml(plugin.pluginDefinition);
        const lastReload = plugin.lastReloadTs ? new Date(plugin.lastReloadTs).toLocaleString() : '';
        let statusStyle = '';
        let rowBackgroundStyle = '';
        if (plugin.status === 'loaded') {
            statusStyle = 'color:green';
        }
        if (plugin.status === 'error') {
            statusStyle = 'color:red';
            rowBackgroundStyle = 'background-color:#FFDDDD';
        }
        pluginRows.push(`
            <tr style="${rowBackgroundStyle}">
                <td>${escapeHtml(plugin.name)}</td>
                <td>${escapeHtml(plugin.description || '')}</td>
                <td>${plugin.type}</td>
                <td>${escapeHtml(plugin.pluginPackage.name)}</td>
                <td style="${statusStyle}">${plugin.status}</td>
                <td>${escapeHtml(plugin.errorMessage || '')}</td>
                <td>${lastReload}</td>
                <td>
                   <script type="application/javascript">
                       window['pluginCfg${pluginIndex}'] = document.createElement('div');
                       window['pluginCfg${pluginIndex}'].innerHTML = '<div class="json">${config}</div>';
                       window['pluginDef${pluginIndex}'] = document.createElement('div');
                       window['pluginDef${pluginIndex}'].innerHTML = '<div class="json">${def}</div>';
                    </script>
                    <a href="javascript:void(0)" onclick="openModal(window['pluginCfg${pluginIndex}'].innerHTML)">Configuration</a>
                    <br/>
                    <a href="javascript:void(0)" onclick="openModal(window['pluginDef${pluginIndex}'].innerHTML)">Plugin&nbsp;Definition</a>
                </td>
            </tr>
        `);
    });

    return `
        <table>
            <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Type</th>
                <th>Package</th>
                <th>Status</th>
                <th>Error</th>
                <th>Last Reload</th>
                <th>&nbsp;</th>
            </tr>
            ${pluginRows.join('')}
        </table>
    `;
};

