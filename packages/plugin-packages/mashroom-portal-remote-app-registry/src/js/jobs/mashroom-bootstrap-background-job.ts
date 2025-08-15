
import RefreshPortalRemoteAppsBackgroundJob from './RefreshPortalRemoteAppsBackgroundJob';
import type {MashroomBackgroundJobPluginBootstrapFunction} from '@mashroom/mashroom-background-jobs/type-definitions';

const bootstrap: MashroomBackgroundJobPluginBootstrapFunction = (pluginName, pluginConfig, pluginContextHolder) => {
    const { registrationRefreshIntervalSec } = pluginConfig;

    const refreshBackgroundJob = new RefreshPortalRemoteAppsBackgroundJob( registrationRefreshIntervalSec,  pluginContextHolder);

    return refreshBackgroundJob.run.bind(refreshBackgroundJob);
};

export default bootstrap;
