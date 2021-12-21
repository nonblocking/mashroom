
import infoTemplate from './template';

import type {Request, Response} from 'express';
import type {MashroomPluginContext} from '../../../../../type-definitions';

const apisRoute = (req: Request, res: Response) => {
    res.type('text/html');
    res.send(infoTemplate(apis(req.pluginContext), req));
};

export default apisRoute;

const apis = (pluginContext: MashroomPluginContext) => `
    <h2>Loaded API Plugins</h2>
    ${apisList(pluginContext)}
`;

const apisList = (pluginContext: MashroomPluginContext) => {
    const rows: Array<string> = [];

    const apis = [...pluginContext.services.core.pluginService.getPlugins().filter((p) => p.type === 'api')];
    apis.sort((a1, a2) => a1.name.localeCompare(a2.name));

    apis.forEach((a) => {
        if (a.config && a.config.path) {
            rows.push(`
                <tr>
                    <td>${a.name}</td>
                    <td><a href="${a.config.path}" target="_blank">${a.config.path}</a></td>
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

