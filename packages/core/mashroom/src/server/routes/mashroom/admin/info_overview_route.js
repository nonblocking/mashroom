// @flow

import infoTemplate from './template';
import {jsonToHtml} from '@mashroom/mashroom-utils/lib/html_utils';

import type {MashroomPluginContext, ExpressRequest, ExpressResponse} from '../../../../../type-definitions';

const overviewRoute = (req: ExpressRequest, res: ExpressResponse) => {
    res.type('text/html');
    res.send(infoTemplate(overview(req.pluginContext), req));
};

export default overviewRoute;

const getUptime = () => {
    const date = new Date(0);
    date.setSeconds(process.uptime());
    return date.toISOString().substr(11, 8);
};

const overview = (pluginContext: MashroomPluginContext) => `
    <table>
        <tr>
            <th>Server name</th>
            <td>${pluginContext.serverConfig.name}</td>
        </tr>
        <tr>
            <th>Server uptime (sec)</th>
            <td>${getUptime()}</td>
        </tr>
        <tr>
            <th>Process ID</th>
            <td>${process.pid}</td>
        </tr>
        <tr>
            <th>Mashroom Server version</th>
            <td>${pluginContext.serverInfo.version}</td>
        </tr>
        <tr>
            <th>Packages in Dev Mode</th>
            <td>${pluginContext.serverInfo.devMode ? '<span style="color:orange">Yes</span>' : 'No'}</td>
        </tr>
        <tr>
            <th>Node.js version</th>
            <td>${process.versions['node']}</td>
        </tr>
        <tr>
            <th>Server configuration</th>
            <td><div class="json">${jsonToHtml(pluginContext.serverConfig)}</div></td>
        </tr>
        <tr>
            <th>Environment</th>
            <td><div class="json">${jsonToHtml(process.env)}</div></td>
        </tr>
    </table>
`;

