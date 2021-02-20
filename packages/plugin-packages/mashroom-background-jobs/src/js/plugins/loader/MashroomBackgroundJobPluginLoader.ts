
import type {
    MashroomPluginLoader,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomLogger,
    MashroomLoggerFactory
} from '@mashroom/mashroom/type-definitions';
import type {MashroomBackgroundJobPluginRegistry} from '../../../../type-definitions/internal';
import type {
    MashroomBackgroundJobCallback,
    MashroomBackgroundJobPluginBootstrapFunction,
    MashroomBackgroundJobService
} from '../../../../type-definitions';

export default class MashroomBackgroundJobPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _registry: MashroomBackgroundJobPluginRegistry, private _backgroundJobsService: MashroomBackgroundJobService, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.backgroundJobs.plugin.loader');
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
        if (!cronSchedule) {
            throw new Error(`Cannot register background job ${plugin.name} because the 'cronSchedule' config attribute is missing!`);
        }
        this._logger.info(`Registering background job plugin: ${plugin.name} with schedule: ${cronSchedule}`);
        this._registry.register(plugin.name, cronSchedule, jobCallback);

        // Start job
        this._backgroundJobsService.scheduleJob(plugin.name, cronSchedule, jobCallback);
    }

    async unload(plugin: MashroomPlugin): Promise<void>  {
        // Stop job
        this._backgroundJobsService.unscheduleJob(plugin.name);

        this._logger.info(`Unregistering background job plugin: ${plugin.name}`);
        this._registry.unregister(plugin.name);
    }
}
