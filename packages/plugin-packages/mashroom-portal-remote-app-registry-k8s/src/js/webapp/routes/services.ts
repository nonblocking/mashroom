
import context from '../../context';
// @ts-ignore
import {jsonToHtml} from '@mashroom/mashroom-utils/lib/html_utils';

import type {Request, Response} from 'express';
import type {KubernetesServiceStatus, ServicesRenderModel} from '../../../../type-definitions';

const formatDate = (ts: number): string => {
    return new Date(ts).toISOString().replace(/T/, ' ').replace(/\..+/, '')
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

export default (request: Request, response: Response) => {

    const model: ServicesRenderModel = {
        baseUrl: request.baseUrl,
        scanError: context.error,
        lastScan: formatDate(context.lastScan),
        serviceNameFilter: context.serviceNameFilter,
        services: context.registry.services
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
                }))
            }))
    };

    response.render('services', model);
}
