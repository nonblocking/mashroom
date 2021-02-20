
# Mashroom Background Jobs

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

This plugin adds a background job scheduler to the _Mashroom Server_ that supports cron expressions.
It is possible to add background jobs via service or as custom plugin.

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

## Services

### MashroomBackgroundJobService

The exposed service is accessible through _pluginContext.services.backgroundJobs.service_

**Interface:**

```ts
export interface MashroomBackgroundJobService {

    /**
     * Schedule a job.
     * Throws an error if the cron expression is invalid
     */
    scheduleJob(name: string, cronSchedule: string, callback: MashroomBackgroundJobCallback): MashroomBackgroundJob;

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
                    "yourConfigProp": "whatever"
                }
            }
        ]
    }
}
```

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
