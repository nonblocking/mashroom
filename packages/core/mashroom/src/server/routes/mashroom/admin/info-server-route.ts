
import {htmlUtils, clusterUtils} from '@mashroom/mashroom-utils';
import {ready} from '../health/checks';
import infoTemplate from './template';

import type {Request, Response} from 'express';

const overviewRoute = async (req: Request, res: Response) => {
    let clusterDetailsHtml = '';
    if (clusterUtils.isNodeCluster()) {
        clusterDetailsHtml = await clusterDetails();
    }

    res.type('text/html');
    res.send(infoTemplate(await overview(req, clusterDetailsHtml), req));
};

export default overviewRoute;

const getUptime = () => {
    const date = new Date(0);
    date.setSeconds(process.uptime());
    return date.toISOString().substr(11, 8);
};

const clusterDetails = async () => {
    const workerPids = await clusterUtils.getAllWorkerPids();

    return `
        <tr>
            <th>Node Worker ID</th>
            <td>${clusterUtils.getWorkerId()}</td>
        </tr>
        <tr>
            <th>Node Worker PIDs</th>
            <td>${workerPids.join(', ')}</td>
        </tr>
    `;
};

const overview = async (req: Request, clusterDetails: string) => {
    const {serverConfig, serverInfo} = req.pluginContext;
    const readyCheckResult = await ready(req);
    return `
        <h2>Server Info</h2>
        <table>
            <tr>
                <th>Server Name</th>
                <td>${serverConfig.name}</td>
            </tr>
            <tr>
                <th>Server Uptime</th>
                <td>${getUptime()}</td>
            </tr>
            <tr>
                <th><a href="/mashroom/health">Server Health</a></th>
                <td>${readyCheckResult.ok ? '<span style="color:green">Ready</span>' : '<span style="color:red">Not ready</span>'}</td>
            </tr>
            <tr>
                <th>Process ID</th>
                <td>${process.pid}</td>
            </tr>
            <tr>
                <th>Mashroom Server Version</th>
                <td>${serverInfo.version}</td>
            </tr>
            <tr>
                <th>Packages in Dev Mode</th>
                <td>${serverInfo.devMode ? '<span style="color:orange">Yes</span>' : 'No'}</td>
            </tr>
            <tr>
                <th>Node.js Version</th>
                <td>${process.versions['node']}</td>
            </tr>
            <tr>
                <th>Node Cluster</th>
                <td>${clusterUtils.isNodeCluster() ? 'Yes' : 'No'}</td>
            </tr>
            ${clusterDetails}
            <tr>
                <th>Server Configuration</th>
                <td><div class="json">${htmlUtils.jsonToHtml(serverConfig)}</div></td>
            </tr>
            <tr>
                <th>Environment</th>
                <td><div class="json">${htmlUtils.jsonToHtml(process.env)}</div></td>
            </tr>
        </table>
    `;
};

