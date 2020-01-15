// @flow

import {cloneAndFreezeObject} from '@mashroom/mashroom-utils/lib/readonly_utils';

import type {MashroomServices} from '../../type-definitions';
import type {MashroomServiceRegistry as MashroomServiceRegistryType} from '../../type-definitions/internal';

export default class MashroomServiceRegistry implements MashroomServiceRegistryType {

    _namespaces: any;

    constructor() {
        this._namespaces = {};
    }

    registerServices(namespace: string, services: MashroomServices) {
        this._namespaces[namespace] = services;
    }

    unregisterServices(namespace: string) {
        delete this._namespaces[namespace];
    }

    getServiceNamespaces() {
        return cloneAndFreezeObject(this._namespaces);
    }
}
