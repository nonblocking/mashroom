
import pm2 from 'pm2';
import serializableResourceMetrics from './serializable-resource-metrics';

import type {MashroomMonitoringMetricsCollectorService} from '@mashroom/mashroom-monitoring-metrics-collector/type-definitions';
import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';

// This connector allows it to grab OpenTelemetry metrics from a worker node
// Checkout the README how to use this

const PM2_WORKER_ID = process.env.pm_id;
let listener: any;

export const startPM2Connector = (pluginContext: MashroomPluginContext) => {
    if (PM2_WORKER_ID) {
        const logger = pluginContext.loggerFactory('mashroom.monitoring.pm2.exporter');
        const collectorService: MashroomMonitoringMetricsCollectorService = pluginContext.services.metrics!.service;

        logger.info('Starting PM2 cluster connector');
        const listener = (msg: any) => {
            if (msg.from !== PM2_WORKER_ID && msg.topic === 'getMetrics') {
                collectorService.getOpenTelemetryResourceMetrics()
                    .then((data) => {
                        pm2.connect((error) => {
                            if (!error) {
                                pm2.sendDataToProcessId(
                                    msg.from,
                                    {
                                        from: PM2_WORKER_ID,
                                        data: serializableResourceMetrics(data),
                                        topic: 'returnMetrics',
                                    },
                                    (error) => {
                                        if (error) {
                                            logger.error('Failed to send metrics via PM2 messaging', error);
                                        }
                                        pm2.disconnect();
                                    },
                                );
                            } else {
                                logger.error('Connecting to PM2 failed', error);
                            }
                        });
                    })
                    .catch((error) => {
                        logger.error('Unable to get metrics in JSON', error);
                    });
            }
        };
        process.on('message', listener);
    }
};

export const stopPM2Connector = () => {
    if (listener) {
        process.off('message', listener);
    }
};
