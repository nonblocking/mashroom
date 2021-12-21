
import {isAbsolute, resolve} from 'path';
import {existsSync} from 'fs';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const logger = pluginContext.loggerFactory('mashroom.robots');
    const {serverConfig: {serverRootFolder}} = pluginContext;
    const robotsTxt = pluginConfig['robots.txt'];

    let robotsTxtPath: string | undefined;
    if (robotsTxt) {
        if (isAbsolute(robotsTxt)) {
            robotsTxtPath = robotsTxt;
        } else {
            robotsTxtPath = resolve(serverRootFolder, robotsTxt);
        }
    }
    if (robotsTxtPath && !existsSync(robotsTxtPath)) {
        logger.error('Robots.txt file not found:', robotsTxtPath);
        robotsTxtPath = undefined;
    }
    if (!robotsTxtPath) {
        robotsTxtPath = resolve(__dirname, '../default-robots.txt');
    }
    logger.info('Using robots.txt file:', robotsTxtPath);

    return (req, res, next) => {
        if (req.url ===  '/robots.txt') {
            res.sendFile(robotsTxtPath!);
            return;
        }
        next();
    };
};

export default bootstrap;
