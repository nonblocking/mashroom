
import MashroomPortalPluginRegistry from '../plugins/MashroomPortalPluginRegistry';

import type {MashroomPortalContext, MashroomPortalPluginConfig} from '../../../type-definitions/internal';

const pluginRegistry = new MashroomPortalPluginRegistry();

let portalPluginConfig: any = {};

const globalPortalContext: MashroomPortalContext = {
    startTs: Date.now(),
    pluginRegistry,
    get portalPluginConfig() {
        return portalPluginConfig;
    },
};

export const setPortalPluginConfig = (config: MashroomPortalPluginConfig): void => {
    portalPluginConfig = config;
};

export default globalPortalContext;
