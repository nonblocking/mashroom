
import {htmlUtils} from '@mashroom/mashroom-utils';
import infoTemplate from './template';

import type {Request, Response} from 'express';
import type {MashroomPluginContext} from '../../../../../type-definitions';

const middlewareStack = (req: Request, res: Response) => {
    res.type('text/html');
    res.send(infoTemplate(middlewares(req.pluginContext), req));
};

export default middlewareStack;

const middlewares = (pluginContext: MashroomPluginContext) => `
    <h2>Loaded Express Middleware Plugins Stack</h2>
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
                <td>${htmlUtils.escapeHtml(m.pluginName)}</td>
                <td>${m.order}</td>
            </tr>
        `));
};
