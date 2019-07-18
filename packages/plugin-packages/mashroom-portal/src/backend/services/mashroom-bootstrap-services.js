// @flow

import context from '../context/global_portal_context';
import MashroomPortalService from './MashroomPortalService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const service = new MashroomPortalService(context.pluginRegistry, pluginContextHolder);

    return {
        service,
    };
};

export default bootstrap;
