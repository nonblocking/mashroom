// @flow

import type {MashroomPluginConfig, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';

export type StorageObject<T: {}> = T & {|
    _id: string
|}

export type StorageObjectFilter<T: {}> = {[$Keys<StorageObject<T>>]: any};

export type StorageUpdateResult = {
    modifiedCount: number,
};

/**
 * Mashroom storage collection
 */
export interface MashroomStorageCollection<T: {}> {
    /**
     * Find all items that match given filter (e.g. { name: 'foo' }).
     */
    find(filter?: StorageObjectFilter<T>, limit?: number): Promise<Array<StorageObject<T>>>;
    /**
     * Return the first item that matches the given filter or null otherwise.
     */
    findOne(filter: StorageObjectFilter<T>): Promise<?StorageObject<T>>;
    /**
     * Insert one item
     */
    insertOne(item: T): Promise<StorageObject<T>>;
    /**
     * Update the first item that matches the given filter.
     */
    updateOne(filter: StorageObjectFilter<T>, propertiesToUpdate: $Shape<StorageObject<T>>): Promise<StorageUpdateResult>;
    /**
     * Replace the first item that matches the given filter.
     */
    replaceOne(filter: StorageObjectFilter<T>, newItem: T): Promise<StorageUpdateResult>;
    /**
     * Delete the first item that matches the given filter.
     */
    deleteOne(filter: StorageObjectFilter<T>): Promise<StorageUpdateResult>;
    /**
     * Delete all items that matches the given filter.
     */
    deleteMany(filter: StorageObjectFilter<T>): Promise<StorageUpdateResult>;
}

/**
 * Mashroom storage interface
 */
export interface MashroomStorage {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T: {}>(name: string): Promise<MashroomStorageCollection<T>>;
}

export interface MashroomStorageService {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T: {}>(name: string): Promise<MashroomStorageCollection<T>>;
}

export type MashroomStorageProviderMap = {
    [name: string]: MashroomStorage
};

export interface MashroomStorageRegistry {
    registerStorage(name: string, storage: MashroomStorage): void;
    unregisterStorage(name: string): void;
    getStorage(name: string): ?MashroomStorage;
    +storages: MashroomStorageProviderMap;
}

/**
 * Bootstrap method definition for storage plugins
 */
export type MashroomStoragePluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomStorage>;
