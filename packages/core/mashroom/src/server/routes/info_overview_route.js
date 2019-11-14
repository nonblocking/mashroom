// @flow

import infoTemplate from './template';
import jsonToHtml from './json_to_html';

import type {MashroomPluginContext, ExpressRequest, ExpressResponse} from '../../../type-definitions';

const overviewRoute = (req: ExpressRequest, res: ExpressResponse) => {
    res.type('text/html');
    res.send(infoTemplate(overview(req.pluginContext), req));
};

export default overviewRoute;

const overview = (pluginContext: MashroomPluginContext) => `
    <table>
        <tr>
            <th>Server name</th>
            <td>${pluginContext.serverConfig.name}</td>
        </tr>
        <tr>
            <th>Server uptime (sec)</th>
            <td>${Math.floor(process.uptime())}</td>
        </tr>
        <tr>
            <th>Process ID</th>
            <td>${process.pid}</td>
        </tr>
        <tr>
            <th>Node.js version</th>
            <td>${process.version}</td>
        </tr>
        <tr>
            <th>Mashroom Server version</th>
            <td>${pluginContext.serverInfo.version}</td>
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

