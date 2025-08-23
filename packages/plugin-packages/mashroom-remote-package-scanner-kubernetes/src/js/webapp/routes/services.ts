
import context from '../../context';
import {SCANNER_NAME} from '../../scanner/KubernetesRemotePluginPackagesScanner';

import type {Request, Response} from 'express';
import type {ServicesRenderModel} from '../../types';

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
        namespaceLabelSelector: context.namespaceLabelSelector,
        watchedNamespaces: context.watchedNamespaces.map(({ name }) => name).join(', '),
        serviceLabelSelector: context.serviceLabelSelector,
        serviceNameFilter: context.serviceNameFilter,
        services: context.services
            .map((service) => {
                const pluginPackage = pluginPackages.find((p) => service.url && p.url.toString() === service.url.toString());
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
                    namespace: service.namespace ?? '',
                    url: service.url ? service.url.toString() : '',
                    runningPods: service.runningPods,
                    imageVersion: service.imageVersion,
                    status,
                    statusClass,
                    lastModified: formatDate(service.lastModified),
                    rowClass: errors ? 'row-error' : '',
                    portalApps: pluginPackage?.foundPlugins ?? undefined,
                    errors,
                };
            })
    };

    response.render('services', model);
};
