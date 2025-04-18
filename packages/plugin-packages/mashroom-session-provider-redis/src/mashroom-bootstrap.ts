
import {RedisStore} from 'connect-redis';
import createClient, {setConfig, close} from './redis-client';
import healthProbe from './health/health-probe';
import {registerStoreMetrics, unregisterStoreMetrics} from './metrics/store-metrics';

import type {MashroomSessionStoreProviderPluginBootstrapFunction} from '@mashroom/mashroom-session/type-definitions';

const bootstrap: MashroomSessionStoreProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory, services: {core: {pluginService, healthProbeService}}} =  pluginContextHolder.getPluginContext();
    const logger = loggerFactory('mashroom.session.provider.redis');
    const {client: redisClintConfig, ...connectRedisOptions} = pluginConfig;

    logger.info('Using key prefix for sessions:', connectRedisOptions.prefix);

    await setConfig(redisClintConfig);
    const client = await createClient(logger);

    healthProbeService.registerProbe(pluginName, healthProbe);
    registerStoreMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        // Close the connection when the plugin reloads
        close();
        healthProbeService.unregisterProbe(pluginName);
        unregisterStoreMetrics();
    });

    return new RedisStore({
        client,
        ...connectRedisOptions,
    });
};

export default bootstrap;
