
import context from '../context';
import RegisterPortalRemoteAppsBackgroundJob from './RegisterPortalRemoteAppsBackgroundJob';
import type {MashroomBackgroundJobPluginBootstrapFunction} from '@mashroom/mashroom-background-jobs/type-definitions';

const bootstrap: MashroomBackgroundJobPluginBootstrapFunction = (pluginName, pluginConfig, pluginContextHolder) => {
    const { socketTimeoutSec, registrationRefreshIntervalSec, unregisterAppsAfterScanErrors } = pluginConfig;

    const registerBackgroundJob = new RegisterPortalRemoteAppsBackgroundJob(socketTimeoutSec, registrationRefreshIntervalSec, unregisterAppsAfterScanErrors, pluginContextHolder);
    context.backgroundJob = registerBackgroundJob;

    return registerBackgroundJob.run.bind(registerBackgroundJob);
};

export default bootstrap;
