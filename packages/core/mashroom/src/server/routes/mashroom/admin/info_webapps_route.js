// @flow

import infoTemplate from './template';

import type {MashroomPluginContext, ExpressRequest, ExpressResponse} from '../../../../../type-definitions';

const webappsRoute = (req: ExpressRequest, res: ExpressResponse) => {
    res.type('text/html');
    res.send(infoTemplate(webapps(req.pluginContext), req));
};

export default webappsRoute;

const webapps = (pluginContext: MashroomPluginContext) => `
    <h2>Loaded Webapp Plugins</h2>
    ${webappsList(pluginContext)}
`;

const webappsList = (pluginContext: MashroomPluginContext) => {
    const webappItems = [];
    pluginContext.services.core.pluginService.getPlugins().filter((p) => p.type === 'web-app').forEach((p) => {
        if (p.config && p.config.path) {
            webappItems.push(`
            <li>
                <a href="${p.config.path}" target="_blank">${p.name}</a>
            </li>
        `);
        }
    });

    return `<ul>${webappItems.join('')}</ul>`;
};

