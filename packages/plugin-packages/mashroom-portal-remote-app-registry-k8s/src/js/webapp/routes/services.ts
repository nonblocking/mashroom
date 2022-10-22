
import {jsonToHtml} from '@mashroom/mashroom-utils/lib/html_utils';
import context from '../../context';

import type {Request, Response} from 'express';
import type {KubernetesServiceStatus, ServicesRenderModel} from '../../../../type-definitions';

const formatDate = (ts: number): string => {
    return new Date(ts).toISOString().replace(/T/, ' ').replace(/\..+/, '');
};

const getRowClass = (status: KubernetesServiceStatus): string => {
    switch (status) {
        case 'Error':
            return 'row-error';
        case 'Headless Service':
        case 'No Descriptor':
            return 'row-ignored';
        default:
            return '';
    }
};

const getStatusClass = (status: KubernetesServiceStatus): string => {
    switch (status) {
        case 'Error':
            return 'error';
        case 'Checking':
            return 'checking';
        default:
            return '';
    }
};

const getStatusWeight = (status: KubernetesServiceStatus): number => {
    if (status === 'Error') {
        return 2;
    }
    if (status === 'Checking') {
        return 1;
    }
    return 0;
};

export default (request: Request, response: Response) => {

    const model: ServicesRenderModel = {
        baseUrl: request.baseUrl,
        hasErrors: context.errors.length > 0,
        errors: context.errors,
        lastScan: formatDate(context.lastScan),
        namespaces: context.namespaces.join(', '),
        serviceLabelSelector: context.serviceLabelSelector,
        serviceNameFilter: context.serviceNameFilter,
        services: [...context.registry.services]
            .sort((s1, s2) => {
                const status1 = getStatusWeight(s1.status);
                const status2 = getStatusWeight(s2.status);
                if (status1 == status2) {
                    return s1.name.localeCompare(s2.name);
                }
                return status2 - status1;
            })
            .map((service) => ({
                name: service.name,
                namespace: service.namespace,
                url: service.url,
                status: service.status !== 'Error' ? service.status : `Error: ${service.error}`,
                lastCheck: formatDate(service.lastCheck),
                rowClass: getRowClass(service.status),
                statusClass: getStatusClass(service.status),
                portalApps: service.foundPortalApps.map((app) => ({
                    name: app.name,
                    version: app.version,
                    pluginDef: jsonToHtml(app),
                })),
                invalidPortalApps: service.invalidPortalApps,
            }))
    };

    response.render('services', model);
};
