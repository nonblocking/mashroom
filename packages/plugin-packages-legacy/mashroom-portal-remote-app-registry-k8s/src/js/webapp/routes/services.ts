
import context from '../../context';
import {SCANNER_NAME} from '../../scanner/KubernetesRemotePortalAppsPluginScanner';

import type {Request, Response} from 'express';
import type {ServicesRenderModel} from '../../../../type-definitions';

const formatDate = (ts: number): string => {
    return new Date(ts).toISOString().replace(/T/, ' ').replace(/\..+/, '');
};

export default (request: Request, response: Response) => {
    const pluginService = request.pluginContext.services.core.pluginService;
    const pluginPackages = pluginService.getPotentialPluginPackagesByScanner(SCANNER_NAME);

    const model: ServicesRenderModel = {
        baseUrl: request.baseUrl,
        hasErrors: context.errors.length > 0,
        errors: context.errors,
        lastScan: formatDate(context.lastScan),
        namespaces: context.namespaces.join(', '),
        serviceLabelSelector: context.serviceLabelSelector,
        serviceNameFilter: context.serviceNameFilter,
        services: context.services
            .map((service) => {
                const pluginPackage = pluginPackages.find((p) => p.url.toString() === service.url.toString());
                const errors = service.error ?? pluginPackage?.updateErrors?.join(', ');
                let status = 'Unknown';
                if (pluginPackage) {
                    status = pluginPackage.processedOnce ? pluginPackage.status : 'pending';
                }
                let statusClass = 'pending';
                if (errors) {
                    status ='Error';
                    statusClass = 'error';
                } else if (pluginPackage?.status === 'processing') {
                    status = 'Processing';
                    statusClass = 'processing';
                } else if (pluginPackage?.status === 'processed') {
                    status = 'Processed';
                    statusClass = 'processed';
                }
                return {
                    name: service.name,
                    namespace: service.namespace,
                    url: service.url.toString(),
                    status,
                    statusClass,
                    lastCheck: formatDate(service.lastCheck),
                    rowClass: errors ? 'row-error' : '',
                    errors,
                    portalApps: pluginPackage?.foundPlugins ?? undefined,
                };
            })
    };

    response.render('services', model);
};
