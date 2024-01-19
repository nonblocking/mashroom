
# Mashroom Background Jobs

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin adds a background job scheduler to the _Mashroom Server_ that supports cron expressions.
It is possible to add background jobs via service or as custom plugin.

If you don't provide a cron expression the job is only executed now (immediately), this is useful if you need
some code that should be executed once during server startup.

This plugin also comes with an Admin UI extension (_/mashroom/admin/ext/background-jobs_) that can be used to check the jobs.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-background-jobs** as *dependency*.

After that you can use the service like this:

```ts
import type {MashroomBackgroundJobService} from '@mashroom/mashroom-background-jobs/type-definitions';

export default async (req: Request, res: Response) => {
    const backgroundJobsService: MashroomBackgroundJobService = req.pluginContext.services.backgroundJobs.service;

    backgroundJobsService.schedule('Test Job', '0/5 * * * *', () => {
       // Job implementation
    });

    // ...
}
```

<span class="panel-warning">
**NOTE**: Despite its name a job is started in the main thread and therefore blocks the event loop.
So, if you do CPU intensive work you need to spawn a [Worker Thread](https://nodejs.org/api/worker_threads.html) yourself.
</span>

## Services

### MashroomBackgroundJobService

The exposed service is accessible through _pluginContext.services.backgroundJobs.service_

**Interface:**

```ts
export interface MashroomBackgroundJobService {

    /**
     * Schedule a job.
     * If cronSchedule is not defined the job is executed once (immediately).
     * Throws an error if the cron expression is invalid.
     */
    scheduleJob(name: string, cronSchedule: string | undefined | null, callback: MashroomBackgroundJobCallback): MashroomBackgroundJob;

    /**
     * Unschedule an existing job
     */
    unscheduleJob(name: string): void;

    readonly jobs: Readonly<Array<MashroomBackgroundJob>>;
}
```

## Plugin Types

### background-job

This plugin type allows it to schedule a background job.

To register your custom background-job plugin add this to _package.json_:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My background job",
                "type": "background-job",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "defaultConfig": {
                   "cronSchedule": "0/1 * * * *",
                   "invokeImmediately": false,
                   "yourConfigProp": "whatever"
                }
            }
        ]
    }
}
```

 * _cronSchedule_: The execution schedule for the job, must be a valid cron expression, see [node-cron](https://github.com/node-cron/node-cron);
   if this is null or undefined the job is executed exactly one during startup.
 * _invokeImmediately_: Optional hint that the job should additionally be invoked immediately (Default: false)

The bootstrap returns the job callback:

```ts
import type {MashroomBackgroundJobPluginBootstrapFunction} from '@mashroom/mashroom-background-jobs/type-definitions';

const bootstrap: MashroomBackgroundJobPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {yourConfigProp} = pluginConfig;
    return (pluginContect) => {
        // Job impl
    };
};

export default bootstrap;
```
