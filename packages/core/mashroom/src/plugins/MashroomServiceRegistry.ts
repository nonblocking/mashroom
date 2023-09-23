
import {cloneAndFreezeObject} from '@mashroom/mashroom-utils/lib/readonly_utils';

import type {MashroomServicePluginServices} from '../../type-definitions';
import type {MashroomServiceRegistry as MashroomServiceRegistryType} from '../../type-definitions/internal';

export default class MashroomServiceRegistry implements MashroomServiceRegistryType {

    private readonly _namespaces: any;

    constructor() {
        this._namespaces = {};
    }

    registerServices(namespace: string, services: MashroomServicePluginServices) {
        this._namespaces[namespace] = services;
    }

    unregisterServices(namespace: string) {
        delete this._namespaces[namespace];
    }

    getServiceNamespaces() {
        return cloneAndFreezeObject(this._namespaces);
    }
}
