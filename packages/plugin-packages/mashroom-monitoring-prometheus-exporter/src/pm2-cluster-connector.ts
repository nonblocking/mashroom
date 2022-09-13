
import pm2 from 'pm2';
import registry from './registry';
import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';

// Within PM2 AggregatorRegistry cannot be used directly, because the master is occupied by PM2 the usual
//  cluster communication with worker.send() cannot be used
// Check https://shogo.eu/blog/2021/01/06/How-to-collect-Prometheus-metrics-from-Node-js-cluster-mode how you could use this

const PM2_WORKER_ID = process.env.pm_id;
let listener: any;

export const startPM2Connector = (pluginContext: MashroomPluginContext) => {
    if (PM2_WORKER_ID) {
        const logger = pluginContext.loggerFactory('mashroom.monitoring.prometheus');
        logger.info('Starting PM2 cluster connector');
        const listener = (msg: any) => {
            if (msg.from !== PM2_WORKER_ID && msg.topic === 'getMetrics') {
                pm2.connect((error) => {
                    if (!error) {
                        registry.getMetricsAsJSON()
                            .then((data) => {
                                pm2.sendDataToProcessId(
                                    msg.from,
                                    {
                                        from: PM2_WORKER_ID,
                                        data: data,
                                        topic: 'returnMetrics',
                                    },
                                    (error) => {
                                        if (error) {
                                            logger.error('Failed to send metrics via PM2 messaging', error);
                                        }
                                    },
                                );
                            })
                            .catch((error) => {
                                logger.error('Unable to get metrics in JSON', error);
                            });
                    } else {
                        logger.error('Connecting to PM2 failed', error);
                    }
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
