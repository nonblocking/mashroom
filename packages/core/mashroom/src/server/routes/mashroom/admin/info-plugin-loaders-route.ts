
import infoTemplate from './template';

import type {Request, Response} from 'express';
import type {MashroomPluginContext} from '../../../../../type-definitions';

const pluginsRoute = (req: Request, res: Response) => {
    res.type('text/html');
    res.send(infoTemplate(plugins(req.pluginContext), req));
};

export default pluginsRoute;

const plugins = (pluginContext: MashroomPluginContext) => `
    <h2>Plugin Loaders</h2>
    ${pluginLoadersTable(pluginContext)}
`;

const pluginLoadersTable = (pluginContext: MashroomPluginContext) => {
    const pluginLoaderRows: Array<string> = [];

    const pluginTypes = Object.keys(pluginContext.services.core.pluginService.getPluginLoaders());
    const pluginLoaders = pluginTypes.map((pluginType) => {
        const pluginLoader = pluginContext.services.core.pluginService.getPluginLoaders()[pluginType];
        return {name: pluginLoader?.name || '', loads: pluginType};
    });
    pluginLoaders.sort((p1, p2) => p1.name.localeCompare(p2.name));

    pluginLoaders.forEach(({name, loads}) => {
        pluginLoaderRows.push(`
            <tr>
                <td>${name}</td>
                <td>${loads}</td>
            </tr>
        `);
    });

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
