
import RedisStore from 'connect-redis';
import createClient, {setConfig, close} from './redis_client';
import healthProbe from './health/health_probe';
import {startExportStoreMetrics, stopExportStoreMetrics} from './metrics/store_metrics';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} =  pluginContextHolder.getPluginContext();
    const logger = loggerFactory('mashroom.session.provider.redis');
    const {client: redisClintConfig, ...connectRedisOptions} = pluginConfig;

    logger.info('Using key prefix for sessions:', connectRedisOptions.prefix);

    await setConfig(redisClintConfig);
    const client = await createClient(logger);

    healthProbeService.registerProbe(pluginName, healthProbe);
    startExportStoreMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        close();
        healthProbeService.unregisterProbe(pluginName);
        stopExportStoreMetrics();
    });

    return new RedisStore({
        client,
        ...connectRedisOptions,
    });
};

export default bootstrap;
