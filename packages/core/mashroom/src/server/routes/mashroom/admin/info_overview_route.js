// @flow

import infoTemplate from './template';
import {jsonToHtml} from '@mashroom/mashroom-utils/lib/html_utils';
import {isNodeCluster, getWorkerId, getAllWorkerPids} from '@mashroom/mashroom-utils/lib/cluster_utils';

import type {MashroomPluginContext, ExpressRequest, ExpressResponse} from '../../../../../type-definitions';

const overviewRoute = async (req: ExpressRequest, res: ExpressResponse) => {
    let clusterDetailsHtml = '';
    if (isNodeCluster()) {
        clusterDetailsHtml = await clusterDetails();
    }

    res.type('text/html');
    res.send(infoTemplate(overview(req.pluginContext, clusterDetailsHtml), req));
};

export default overviewRoute;

const getUptime = () => {
    const date = new Date(0);
    date.setSeconds(process.uptime());
    return date.toISOString().substr(11, 8);
};

const clusterDetails = async () => {
    const workerPids = await getAllWorkerPids();

    return `
        <tr>
            <th>Node Worker ID</th>
            <td>${getWorkerId()}</td>
        </tr>
        <tr>
            <th>Node Worker PIDs</th>
            <td>${workerPids.join(', ')}</td>
        </tr>
    `;
}

const overview = (pluginContext: MashroomPluginContext, clusterDetails: string) => `
    <table>
        <tr>
            <th>Server Name</th>
            <td>${pluginContext.serverConfig.name}</td>
        </tr>
        <tr>
            <th>Server Uptime (sec)</th>
            <td>${getUptime()}</td>
        </tr>
        <tr>
            <th>Process ID</th>
            <td>${process.pid}</td>
        </tr>
        <tr>
            <th>Mashroom Server Version</th>
            <td>${pluginContext.serverInfo.version}</td>
        </tr>
        <tr>
            <th>Packages in Dev Mode</th>
            <td>${pluginContext.serverInfo.devMode ? '<span style="color:orange">Yes</span>' : 'No'}</td>
        </tr>
        <tr>
            <th>Node.js Version</th>
            <td>${process.versions['node']}</td>
        </tr>
        <tr>
            <th>Node Cluster</th>
            <td>${isNodeCluster() ? 'Yes' : 'No'}</td>
        </tr>
        ${clusterDetails}
        <tr>
            <th>Server Configuration</th>
            <td><div class="json">${jsonToHtml(pluginContext.serverConfig)}</div></td>
        </tr>
        <tr>
            <th>Environment</th>
            <td><div class="json">${jsonToHtml(process.env)}</div></td>
        </tr>
    </table>
`;

