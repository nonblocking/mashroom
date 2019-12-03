// @flow

import type {ExpressRequest, ExpressResponse} from '../../../type-definitions';

const indexRoute = (req: ExpressRequest, res: ExpressResponse) => {
    const pluginContext = req.pluginContext;

    if (!pluginContext.serverConfig.indexPage || pluginContext.serverConfig.indexPage.length < 2) {
        res.redirect('/mashroom');
    } else {
        let redirectPath = pluginContext.serverConfig.indexPage;
        const { originalUrl } = req;
        const queryIdx = originalUrl.indexOf('?');

        if (queryIdx > -1) {
            redirectPath += originalUrl.substr(queryIdx);
        }

        res.redirect(redirectPath);
    }
};

export default indexRoute;
