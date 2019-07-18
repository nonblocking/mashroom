// @flow

import type {ExpressRequest, ExpressResponse} from '../../../type-definitions/index';

const indexRoute = (req: ExpressRequest, res: ExpressResponse) => {
    const pluginContext = req.pluginContext;

    if (!pluginContext.serverConfig.indexPage || pluginContext.serverConfig.indexPage.length < 2) {
        res.redirect('/mashroom');
    } else {
        res.redirect(pluginContext.serverConfig.indexPage);
    }
};

export default indexRoute;
