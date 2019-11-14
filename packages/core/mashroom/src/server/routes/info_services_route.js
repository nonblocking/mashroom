// @flow

import infoTemplate from './template';

import type {MashroomPluginContext, ExpressRequest, ExpressResponse} from '../../../type-definitions';

const servicesRoute = (req: ExpressRequest, res: ExpressResponse) => {
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
    const s = [];
    for (const namespace in pluginContext.services) {
        if (pluginContext.services.hasOwnProperty(namespace)) {
            for (const serviceName in pluginContext.services[namespace]) {
                if (pluginContext.services[namespace].hasOwnProperty(serviceName)) {
                    s.push({namespace, serviceName});
                }
            }
        }
    }
    return s;
};

const methods = (namespace: string, serviceName: string, pluginContext: MashroomPluginContext) => {
    const ms = [];
    for (const methodName of Object.getOwnPropertyNames(Object.getPrototypeOf(pluginContext.services[namespace][serviceName]))) {
        if (methodName !== 'constructor' && !methodName.startsWith('_')) {
            ms.push(methodName);
        }
    }
    return ms;
};
