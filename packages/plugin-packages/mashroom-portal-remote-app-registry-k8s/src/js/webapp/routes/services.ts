import context from '../../context';

import {Request, Response} from "express";
import {ServicesRenderModel} from "../../../../type-definitions";

const formatDate = (ts: number): string => {
    return new Date(ts).toISOString().replace(/T/, ' ').replace(/\..+/, '')
};

export default (request: Request, response: Response) => {

    const model: ServicesRenderModel = {
        baseUrl: request.baseUrl,
        error: context.error,
        lastScan: formatDate(context.lastScan),
        totalServices: String(context.registry.services.length),
        services: context.registry.services
            .filter((service) => service.descriptorFound)
            .map((service) => ({
                name: service.name,
                namespace: service.namespace,
                url: service.url,
                status: service.error ? 'Error' : 'Registered',
                portalApps: service.foundPortalApps.map((app) => `${app.name} (${app.version})`).join(', '),
                lastCheck: formatDate(service.lastCheck),
                rowClass: service.error ? 'row-error' : '',
                statusClass: service.error ? 'error' : 'registered',
            }))
    };

    response.render('services', model);
}
