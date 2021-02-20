
import context from '../context';
import RegisterPortalRemoteAppsBackgroundJob from './RegisterPortalRemoteAppsBackgroundJob';
import type {MashroomBackgroundJobPluginBootstrapFunction} from '@mashroom/mashroom-background-jobs/type-definitions';

const bootstrap: MashroomBackgroundJobPluginBootstrapFunction = (pluginName, pluginConfig, pluginContextHolder) => {
    const { socketTimeoutSec, registrationRefreshIntervalSec } = pluginConfig;

    const registerBackgroundJob = new RegisterPortalRemoteAppsBackgroundJob(socketTimeoutSec, registrationRefreshIntervalSec, pluginContextHolder);
    context.backgroundJob = registerBackgroundJob;

    // Run immediately
    registerBackgroundJob.run();

    return registerBackgroundJob.run.bind(registerBackgroundJob);
};

export default bootstrap;
