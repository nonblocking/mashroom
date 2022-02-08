
import {resolve, isAbsolute} from 'path';
import {existsSync} from 'fs';
import webapp from './webapp';
import context from './context';

import type {MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory, serverConfig} = pluginContextHolder.getPluginContext();
    const {pageTitle: customPageTitle, loginFormTitle: customLoginFormTitle, styleFile: externalStyleFile} = pluginConfig;
    const logger = loggerFactory('mashroom.login.webapp');

    let styleFile = resolve(__dirname, './style.css');
    if (externalStyleFile) {
        let externalStyleFileFullPath;
        if (isAbsolute(externalStyleFile)) {
            externalStyleFileFullPath = externalStyleFile;
        } else {
            externalStyleFileFullPath = resolve(serverConfig.serverRootFolder, externalStyleFile)
        }
        if (existsSync(externalStyleFileFullPath)) {
            styleFile = externalStyleFileFullPath;
        } else {
            logger.error(`Style file not found: ${externalStyleFileFullPath}`);
        }
    }
    context.styleFile = styleFile;

    const pageTitle = customPageTitle || serverConfig.name;
    context.pageTitle = pageTitle;

    const loginFormTitle = customLoginFormTitle || 'login';
    context.loginFormTitle = loginFormTitle;

    context.indexPage = serverConfig.indexPage;

    return webapp;
};

export default bootstrap;
