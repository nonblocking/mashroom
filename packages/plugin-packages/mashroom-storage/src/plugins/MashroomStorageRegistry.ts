
import type {MashroomStorage} from '../../type-definitions';
import type {MashroomStorageRegistry as MashroomStorageRegistryType, MashroomStorageProviderMap} from '../../type-definitions/internal';

export default class MashroomStorageRegistry implements MashroomStorageRegistryType {

    private _storages: MashroomStorageProviderMap;

    constructor() {
        this._storages = {};
    }

    registerStorage(providerName: string, storage: MashroomStorage): void {
        this._storages[providerName] = storage;
    }

    unregisterStorage(providerName: string): void {
        delete this._storages[providerName];
    }

    getStorage(providerName: string): MashroomStorage | undefined | null {
        return this._storages[providerName];
    }

    get storages(): MashroomStorageProviderMap {
        return Object.freeze({...this._storages});
    }
}
