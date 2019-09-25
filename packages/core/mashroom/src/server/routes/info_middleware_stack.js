// @flow

import infoTemplate from './info_template';

import type {MashroomPluginContext, ExpressRequest, ExpressResponse} from '../../../type-definitions';

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
    <table>
        <tr>
            <th>Middleware</th>
            <th>Order</th>
        </tr>
        ${middlewareRows(pluginContext).join('')}
    </table>
`;

const middlewareRows = (pluginContext: MashroomPluginContext) => {
    return pluginContext.services.core.middlewareStackService.getStack()
        .map((m) => (`
            <tr>
                <td>${m.pluginName}</td>
                <td>${m.order}</td>
            </tr>
        `));
};
