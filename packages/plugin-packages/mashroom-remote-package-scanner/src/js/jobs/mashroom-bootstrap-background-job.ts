
import RefreshRemotePluginPackagesBackgroundJob from './RefreshRemotePluginPackagesBackgroundJob';
import type {MashroomBackgroundJobPluginBootstrapFunction} from '@mashroom/mashroom-background-jobs/type-definitions';

const bootstrap: MashroomBackgroundJobPluginBootstrapFunction = (pluginName, pluginConfig, pluginContextHolder) => {
    const { registrationRefreshIntervalSec } = pluginConfig;

    const refreshBackgroundJob = new RefreshRemotePluginPackagesBackgroundJob( registrationRefreshIntervalSec,  pluginContextHolder);

    return refreshBackgroundJob.run.bind(refreshBackgroundJob);
};

export default bootstrap;
