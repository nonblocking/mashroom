
import infoTemplate from './template';

import type {Request, Response} from 'express';
import type {MashroomPluginContext} from '../../../../../type-definitions';

const webappsRoute = (req: Request, res: Response) => {
    res.type('text/html');
    res.send(infoTemplate(webapps(req.pluginContext), req));
};

export default webappsRoute;

const webapps = (pluginContext: MashroomPluginContext) => `
    <h2>Loaded Express Web-App Plugins</h2>
    ${webappsList(pluginContext)}
`;

const webappsList = (pluginContext: MashroomPluginContext) => {
    const rows: Array<string> = [];

    const webapps = [...pluginContext.services.core.pluginService.getPlugins().filter((p) => p.type === 'web-app')];
    webapps.sort((w1, w2) => w1.name.localeCompare(w2.name));

    webapps.forEach((p) => {
        if (p.config && p.config.path) {
            rows.push(`
                <tr>
                    <td>${p.name}</td>
                    <td><a href="${p.config.path}" target="_blank">${p.config.path}</a></td>
                </tr>
            `);
        }
    });

    return `
        <table>
            <tr>
                <th>Name</th>
                <th>Path</th>
            </tr>
            ${rows.join('')}
        </table>
    `;
};

