
import createRedisStore from 'connect-redis';
import createClient, {setConfig, close} from './redis_client';
import healthProbe from './health/health_probe';
import {startExportStoreMetrics, stopExportStoreMetrics} from './metrics/store_metrics';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';
import type {IORedisConfig} from '../type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder, expressSession) => {
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} =  pluginContextHolder.getPluginContext();
    const logger = loggerFactory('mashroom.session.provider.redis');
    const redisConfig = pluginConfig as IORedisConfig;

    // We have to move the keyPrefix to RedisStore,
    // otherwise counting and destroying of sessions won't work
    const keyPrefix = redisConfig.redisOptions.keyPrefix;
    delete redisConfig.redisOptions.keyPrefix;

    await setConfig(redisConfig);
    const client = await createClient(logger);

    healthProbeService.registerProbe(pluginName, healthProbe);
    startExportStoreMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        close();
        healthProbeService.unregisterProbe(pluginName);
        stopExportStoreMetrics();
    });

    const RedisStore = createRedisStore(expressSession);
    return new RedisStore({
        client,
        prefix: keyPrefix,
    });
};

export default bootstrap;
