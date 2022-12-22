
import type {
    MashroomPluginLoader,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomBackgroundJobPluginRegistry} from '../../../../type-definitions/internal';
import type {
    MashroomBackgroundJobCallback,
    MashroomBackgroundJobPluginBootstrapFunction,
    MashroomBackgroundJobService
} from '../../../../type-definitions';

export default class MashroomBackgroundJobPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomBackgroundJobPluginRegistry, private _pluginContextHolder: MashroomPluginContextHolder) {
        this._logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.backgroundJobs.plugin.loader');
    }

    get name(): string {
        return 'Http Proxy Interceptor Plugin Loader';
    }

    generateMinimumConfig(): MashroomPluginConfig {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        const bootstrap: MashroomBackgroundJobPluginBootstrapFunction = plugin.requireBootstrap();
        const jobCallback: MashroomBackgroundJobCallback = bootstrap(plugin.name, config, contextHolder);
        const cronSchedule = config.cronSchedule;
        this._logger.info(`Registering background job plugin: ${plugin.name} with schedule: ${cronSchedule}`);
        this._registry.register(plugin.name, cronSchedule, jobCallback);

        // Start job
        const backgroundJobsService: MashroomBackgroundJobService = this._pluginContextHolder.getPluginContext().services.backgroundJobs!.service;
        backgroundJobsService.scheduleJob(plugin.name, cronSchedule, jobCallback);
    }

    async unload(plugin: MashroomPlugin): Promise<void>  {
        // Stop job
        const backgroundJobsService: MashroomBackgroundJobService = this._pluginContextHolder.getPluginContext().services.backgroundJobs!.service;
        backgroundJobsService.unscheduleJob(plugin.name);

        this._logger.info(`Unregistering background job plugin: ${plugin.name}`);
        this._registry.unregister(plugin.name);
    }
}
