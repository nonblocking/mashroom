
import {htmlUtils} from '@mashroom/mashroom-utils';
import infoTemplate from './template';

import type {Request, Response} from 'express';
import type {MashroomPluginContext} from '../../../../../type-definitions';

const pluginsRoute = (req: Request, res: Response) => {
    res.type('text/html');
    res.send(infoTemplate(plugins(req.pluginContext), req));
};

export default pluginsRoute;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const plugins = (pluginContext: MashroomPluginContext) => `
    <h2>Plugins</h2>
    ${pluginTable(pluginContext)}
`;

const pluginTable = (pluginContext: MashroomPluginContext) => {
    const pluginRows: Array<string> = [];

    const plugins = [...pluginContext.services.core.pluginService.getPlugins()];
    plugins.sort((p1, p2) => p1.name.localeCompare(p2.name));

    plugins.forEach((plugin, pluginIndex) => {
        const config = plugin.config ? htmlUtils.jsonToHtml(plugin.config) : '&nbsp;';
        const def = htmlUtils.jsonToHtml(plugin.pluginDefinition);
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
                <td>${htmlUtils.escapeHtml(plugin.name)}</td>
                <td>${htmlUtils.escapeHtml(plugin.description || '')}</td>
                <td>${plugin.type}</td>
                <td>${htmlUtils.escapeHtml(plugin.pluginPackage.name)}</td>
                <td style="${statusStyle}">${capitalize(plugin.status)}</td>
                <td>${htmlUtils.escapeHtml(plugin.errorMessage || '')}</td>
                <td>${lastReload}</td>
                <td>
                   <script type="text/javascript">
                       window['pluginCfg${pluginIndex}'] = document.createElement('div');
                       window['pluginCfg${pluginIndex}'].innerHTML = '<div class="json">${config.replace(/'/g, '\\\'')}</div>';
                       window['pluginDef${pluginIndex}'] = document.createElement('div');
                       window['pluginDef${pluginIndex}'].innerHTML = '<div class="json">${def.replace(/'/g, '\\\'')}</div>';
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

