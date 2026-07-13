
import context from '../context';
import webapp from './webapp';

import type {
    MashroomWebAppPluginBootstrapFunction
} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const { showAddRemotePluginPackageForm } = pluginConfig;
    context.showAddRemotePluginPackageForm = showAddRemotePluginPackageForm;

    return webapp;
};

export default bootstrap;
