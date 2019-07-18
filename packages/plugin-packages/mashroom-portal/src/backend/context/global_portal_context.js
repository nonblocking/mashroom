// @flow

import MashroomPortalPluginRegistry from '../plugins/MashroomPortalPluginRegistry';
import setupWebapp from '../setup-webapp';

import type {MashroomPortalContext, MashroomPortalPluginConfig} from '../../../type-definitions';

const startTimestamp = Date.now();

const pluginRegistry = new MashroomPortalPluginRegistry();

const portalWebapp = setupWebapp(pluginRegistry, startTimestamp);

let portalPluginConfig: any = {};

const globalPortalContext: MashroomPortalContext = {
    startTs: Date.now(),
    pluginRegistry,
    portalWebapp,
    get portalPluginConfig() {
        return portalPluginConfig;
    },
};

export const setPortalPluginConfig = (config: MashroomPortalPluginConfig) => {
    portalPluginConfig = config;
};

export default globalPortalContext;
