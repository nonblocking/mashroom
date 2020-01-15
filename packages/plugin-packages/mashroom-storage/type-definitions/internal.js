// @flow

import type {MashroomStorage} from './api';

export type MashroomStorageProviderMap = {
    [name: string]: MashroomStorage
};

export interface MashroomStorageRegistry {
    registerStorage(name: string, storage: MashroomStorage): void;
    unregisterStorage(name: string): void;
    getStorage(name: string): ?MashroomStorage;
    +storages: MashroomStorageProviderMap;
}
