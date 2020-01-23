// @flow

import webapp from './webapp';

import {MashroomWebAppPluginBootstrapFunction} from "@mashroom/mashroom/type-definitions";

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    return webapp;
};

export default bootstrap;
