
import type {Request, Response} from 'express';

const indexRoute = (req: Request, res: Response) => {
    const pluginContext = req.pluginContext;

    if (!pluginContext.serverConfig.indexPage || pluginContext.serverConfig.indexPage.length < 2) {
        // Forward to Admin UI
        res.redirect('/mashroom/admin');
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
