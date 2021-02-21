
import express from 'express';
import app from './webapp';
import bootstrap from '../jobs/mashroom-bootstrap-background-job';

// @ts-ignore
process.env.DUMMY_K8S_CONNECTOR = true;

const pluginConfig = {
    k8sNamespaces: ['default'],
    refreshIntervalSec: 120,
    serviceNameFilter: '.*',
    accessViaClusterIP: true,
};
const contextHolder: any = {
    getPluginContext: () => ({
        loggerFactory: () => console,
        services: {
            core: {
                pluginService: {
                    onUnloadOnce: () => {
                        // no implementation required
                    },
                },
            },
        },
    })
};

bootstrap('Mashroom Portal Remote App Registry Kubernetes', pluginConfig, contextHolder);

const wrapperApp = express();

wrapperApp.get('/', (req, res) => {
    res.redirect('/portal-remote-app-registry-kubernetes')
});

wrapperApp.use('/portal-remote-app-registry-kubernetes', app);

wrapperApp.listen(8083, () => {
    console.log('Listening on 8083');
});
wrapperApp.once('error', (error) => {
    console.error('Failed to start server!', error);
});

