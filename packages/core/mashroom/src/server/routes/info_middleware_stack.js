// @flow

import infoTemplate from './info_template';

import type {MashroomPluginContext, ExpressRequest, ExpressResponse} from '../../../type-definitions/index';

const middlewareStack = (req: ExpressRequest, res: ExpressResponse) => {
    res.type('text/html');
    res.send(infoTemplate(middlewares(req.pluginContext), req));
};

export default middlewareStack;

const middlewares = (pluginContext: MashroomPluginContext) => `
    <h2>Middleware Stack</h2>
    <p>
        (The middleware on top of the list is executed first)
    </p>
    <table border="1" cellspacing="0" cellpadding="10">
        <tr>
            <th>Middleware</th>
            <th>Order</th>
        </tr>
        ${middlewareRows(pluginContext).join('')}
    </table>
`;

const middlewareRows = (pluginContext: MashroomPluginContext) => {
    return pluginContext.services.core.pluginService.getPlugins()
        .filter((p) => p.type === 'middleware')
        .map((p) => ({ name: p.name, order: p.config && p.config.order || 1}))
        .sort((m1, m2) => m1.order - m2.order)
        .map((m) => (`
            <tr>
                <td>${m.name}</td>
                <td>${m.order}</td>
            </tr>
        `));
};
