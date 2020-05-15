// @flow

import type {MashroomStorage} from './api';

export type MemoryCacheProperties = {
    enabled?: boolean;
    ttlSec?: number;
    invalidateOnUpdate?: boolean;
}

export type MemoryCacheConfig = MemoryCacheProperties & {
    collections?: {
        [name: string]: MemoryCacheProperties;
    };
}

export type MashroomStorageProviderMap = {
    [name: string]: MashroomStorage
};

export interface MashroomStorageRegistry {
    registerStorage(name: string, storage: MashroomStorage): void;
    unregisterStorage(name: string): void;
    getStorage(name: string): MashroomStorage | undefined | null;
    readonly storages: MashroomStorageProviderMap;
}
