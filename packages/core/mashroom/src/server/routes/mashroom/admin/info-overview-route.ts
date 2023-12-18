
import {ready} from '../health/checks';
import infoTemplate from './template';

import type {Request, Response} from 'express';
import type {MashroomPluginContext} from '../../../../../type-definitions';

const overviewRoute = async (req: Request, res: Response) => {
    res.type('text/html');
    res.send(infoTemplate(await overview(req, req.pluginContext), req));
};

export default overviewRoute;

const getUptime = () => {
    const date = new Date(0);
    date.setSeconds(process.uptime());
    return date.toISOString().substr(11, 8);
};

const overview = async (req: Request, pluginContext: MashroomPluginContext) => `
    <h2>Server Overview</h2>
    ${await serverOverviewTable(req)}
    <div class="details-link">
        <a href="/mashroom/admin/server-info">Server Details</a>
    </div>
    <h2>Plugins Overview</h2>
    ${pluginOverviewTable(pluginContext)}
`;

const serverOverviewTable = async (req: Request) => {
    const {serverConfig, serverInfo} = req.pluginContext;
    const readyCheckResult = await ready(req);
    return `
        <table>
            <tr>
                <th>Server Name</th>
                <td>${serverConfig.name}</td>
                <td>&nbsp;</td>
            </tr>
            <tr>
                <th>Server Uptime</th>
                <td>${getUptime()}</td>
                <td>&nbsp;</td>
            </tr>
            <tr>
                <th><a href="/mashroom/health">Server Health</a></th>
                <td>${readyCheckResult.ok ? '<span style="color:green">Ready</span>' : '<span style="color:red">Not ready</span>'}</td>
                <td><span style="color:red">${(readyCheckResult.errors || []).join('<br/>')}</span></td>
            </tr>
            <tr>
                <th>Mashroom Server Version</th>
                <td>${serverInfo.version}</td>
                <td>&nbsp;</td>
            </tr>
            <tr>
                <th>Packages in Dev Mode</th>
                <td>${serverInfo.devMode ? '<span style="color:orange">Yes</span>' : 'No'}</td>
                <td>&nbsp;</td>
            </tr>
        </table>
    `;
};

const pluginOverviewTable = (pluginContext: MashroomPluginContext) => {
    const pluginService = pluginContext.services.core.pluginService;

    const packageCount = pluginService.getPluginPackages().length;
    const packageReadyCount = pluginService.getPluginPackages().filter((p) => p.status === 'ready').length;
    const packageErrorCount = pluginService.getPluginPackages().filter((p) => p.status === 'error').length;
    const pluginCount = pluginService.getPlugins().length;
    const pluginsReadyCount = pluginService.getPlugins().filter((p) => p.status === 'loaded').length;
    const pluginsErrorCount = pluginService.getPlugins().filter((p) => p.status === 'error').length;
    const middlewareCount = pluginService.getPlugins().filter((p) => p.type === 'middleware').length;
    const middlewareReadyCount = pluginService.getPlugins().filter((p) => p.type === 'middleware' && p.status === 'loaded').length;
    const middlewareErrorCount = pluginService.getPlugins().filter((p) => p.type === 'middleware' && p.status === 'error').length;
    const servicesCount = pluginService.getPlugins().filter((p) => p.type === 'services').length;
    const servicesReadyCount = pluginService.getPlugins().filter((p) => p.type === 'services' && p.status === 'loaded').length;
    const servicesErrorCount = pluginService.getPlugins().filter((p) => p.type === 'services' && p.status === 'error').length;
    const webappsCount = pluginService.getPlugins().filter((p) => p.type === 'web-app').length;
    const webappsReadyCount = pluginService.getPlugins().filter((p) => p.type === 'web-app' && p.status === 'loaded').length;
    const webappsErrorCount = pluginService.getPlugins().filter((p) => p.type === 'web-app' && p.status === 'error').length;

    return `
        <table>
            <tr>
                <th>&nbsp;</th>
                <th>Total</th>
                <th>Ready</th>
                <th>Error</th>
                <th>&nbsp;</th>
            </tr>
            <tr>
                <td>Plugin Packages</td>
                <td>${packageCount}</td>
                <td><span style="color:green">${packageReadyCount || ''}</span></td>
                <td><span style="color:red">${packageErrorCount || ''}</span></td>
                 <td><a href="/mashroom/admin/plugin-packages">Details</a></td>
            </tr>
            <tr>
                <td>Plugins</td>
                <td>${pluginCount}</td>
                <td><span style="color:green">${pluginsReadyCount || ''}</span></td>
                <td><span style="color:red">${pluginsErrorCount || ''}</span></td>
                <td><a href="/mashroom/admin/plugins">Details</a></td>
            </tr>
            <tr>
                <td>Middlewares</td>
                <td>${middlewareCount}</td>
                <td><span style="color:green">${middlewareReadyCount || ''}</span></td>
                <td><span style="color:red">${middlewareErrorCount || ''}</span></td>
                <td><a href="/mashroom/admin/middleware">Details</a></td>
            </tr>
            <tr>
                <td>Services</td>
                <td>${servicesCount}</td>
                <td><span style="color:green">${servicesReadyCount || ''}</span></td>
                <td><span style="color:red">${servicesErrorCount || ''}</span></td>
                <td><a href="/mashroom/admin/services">Details</a></td>
            </tr>
            <tr>
                <td>Webapps</td>
                <td>${webappsCount}</td>
                <td><span style="color:green">${webappsReadyCount || ''}</span></td>
                <td><span style="color:red">${webappsErrorCount || ''}</span></td>
                <td><a href="/mashroom/admin/webapps">Details</a></td>
            </tr>
        </table>
    `;
};

