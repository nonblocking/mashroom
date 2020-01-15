// @flow

import {createReadonlyProxy} from '@mashroom/mashroom-utils/lib/readonly_utils';

import type {MashroomStorage} from '../../type-definitions';
import type {MashroomStorageRegistry as MashroomStorageRegistryType, MashroomStorageProviderMap} from '../../type-definitions/internal';

export default class MashroomStorageRegistry implements MashroomStorageRegistryType {

    _storages: MashroomStorageProviderMap;

    constructor() {
        this._storages = {};
    }

    registerStorage(providerName: string, storage: MashroomStorage) {
        this._storages[providerName] = storage;
    }

    unregisterStorage(providerName: string) {
        delete this._storages[providerName];
    }

    getStorage(providerName: string) {
        return this._storages[providerName];
    }

    get storages() {
        return createReadonlyProxy(this._storages);
    }
}
