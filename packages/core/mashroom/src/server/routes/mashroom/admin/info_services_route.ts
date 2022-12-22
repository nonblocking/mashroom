
import infoTemplate from './template';

import type {Request, Response} from 'express';
import type {MashroomPluginContext} from '../../../../../type-definitions';

const servicesRoute = (req: Request, res: Response) => {
    res.type('text/html');
    res.send(infoTemplate(services(req.pluginContext), req));
};

export default servicesRoute;

const services = (pluginContext: MashroomPluginContext) => `
    <h2>Registered Services</h2>
    <table>
        <tr>
            <th>Service</th>
            <th>Methods</th>
        </tr>
        ${serviceRows(pluginContext).join('')}
    </table>
`;

const serviceRows = (pluginContext: MashroomPluginContext) => {
    return serviceNames(pluginContext).map((serviceName) => {
        return `
            <tr>
                <td>${serviceName.namespace}.${serviceName.serviceName}</td>
                <td>
                    <ul>
                        ${methods(serviceName.namespace, serviceName.serviceName, pluginContext).map((m) => `<li>${m}</li>`).join('')}
                    </ul>
                </td>
            </tr>
        `;
    });
};

const serviceNames = (pluginContext: MashroomPluginContext) => {
    const services = [];
    for (const namespace in pluginContext.services) {
        if (pluginContext.services.hasOwnProperty(namespace)) {
            for (const serviceName in pluginContext.services[namespace]) {
                if (pluginContext.services[namespace]?.hasOwnProperty(serviceName)) {
                    services.push({namespace, serviceName});
                }
            }
        }
    }

    services.sort((s1, s2) => {
        if (s1.namespace === 'core') {
            return -1;
        }
        if (s2.namespace === 'core') {
            return 1;
        }
        return s1.namespace.localeCompare(s2.namespace);
    });

    return services;
};

const methods = (namespace: string, serviceName: string, pluginContext: MashroomPluginContext) => {
    const ms = [];
    for (const methodName of Object.getOwnPropertyNames(Object.getPrototypeOf(pluginContext.services[namespace]?.[serviceName]))) {
        if (methodName !== 'constructor' && !methodName.startsWith('_') && typeof (pluginContext.services[namespace]?.[serviceName][methodName] === 'function')) {
            ms.push(methodName);
        }
    }
    return ms;
};
