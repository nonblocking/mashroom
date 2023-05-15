import PM2MetricExporter from '../src/PM2MetricExporter';

describe('PM2MetricExporter', () => {

    it('exports selected metrics to PM2', () => {
        const config = {
            pmxMetrics: {},
            mashroomMetrics: [
                'mashroom_plugins_total',
                'mashroom_plugins_loaded_total',
                'mashroom_plugins_error_total',
                'mashroom_remote_apps_total',
                'mashroom_remote_apps_error_total'
            ]
        };
        const pluginContextHolder= {
            getPluginContext: () => ({
                loggerFactory: () => console,
                services: {
                    metrics: {
                        service: {
                            getMetrics: () => ({
                                foo: {
                                  type: 'gauge',
                                },
                                mashroom_plugins_total: {
                                    type: 'counter',
                                    data: [{
                                        value: 10,
                                        labels: {
                                            foo: 'bar',
                                            x: 1,
                                        }
                                    }]
                                },
                                mashroom_plugins_error_total: {
                                    type: 'counter',
                                    data: [{
                                        value: 2
                                    }]
                                }
                            })
                        }
                    }
                }
            } as any)
        };

        const exporter = new PM2MetricExporter(config, pluginContextHolder);

        // @ts-ignore
        exporter._exportMashroomMetrics();

        // @ts-ignore
        const metrics = exporter._pm2Metrics;

        expect(Object.keys(metrics)).toEqual([
            'mashroom_plugins_total[foo=bar,x=1]',
            'mashroom_plugins_error_total',
        ]);
    });

});
