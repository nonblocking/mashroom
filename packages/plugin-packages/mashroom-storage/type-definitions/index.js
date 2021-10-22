// @flow

import type {MashroomPluginConfig, MashroomPluginContextHolder} from "@mashroom/mashroom/type-definitions";

export type MashroomStorageRecord = {};

export type MashroomStorageObject<T: MashroomStorageRecord> = T & {|
    _id: any
|}

export type MashroomStorageObjectFilter<T: MashroomStorageRecord> = {[$Keys<MashroomStorageObject<T>>]: any};

export type MashroomStorageUpdateResult = {
    modifiedCount: number,
};

export type MashroomStorageDeleteResult = {
    deletedCount: number;
};

/**
 * Mashroom storage collection
 */
export interface MashroomStorageCollection<T: MashroomStorageRecord> {
    /**
     * Find all items that match given filter (e.g. { name: 'foo' }).
     */
    find(filter?: MashroomStorageObjectFilter<T>, limit?: number): Promise<Array<MashroomStorageObject<T>>>;
    /**
     * Return the first item that matches the given filter or null otherwise.
     */
    findOne(filter: MashroomStorageObjectFilter<T>): Promise<?MashroomStorageObject<T>>;
    /**
     * Insert one item
     */
    insertOne(item: T): Promise<MashroomStorageObject<T>>;
    /**
     * Update the first item that matches the given filter.
     */
    updateOne(filter: MashroomStorageObjectFilter<T>, propertiesToUpdate: $Shape<MashroomStorageObject<T>>): Promise<MashroomStorageUpdateResult>;
    /**
     * Replace the first item that matches the given filter.
     */
    replaceOne(filter: MashroomStorageObjectFilter<T>, newItem: T): Promise<MashroomStorageUpdateResult>;
    /**
     * Delete the first item that matches the given filter.
     */
    deleteOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult>;
    /**
     * Delete all items that matches the given filter.
     */
    deleteMany(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult>;
}

/**
 * Mashroom storage interface
 */
export interface MashroomStorage {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T: MashroomStorageRecord>(name: string): Promise<MashroomStorageCollection<T>>;
}

export interface MashroomStorageService {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T: MashroomStorageRecord>(name: string): Promise<MashroomStorageCollection<T>>;
}

/**
 * Bootstrap method definition for storage plugins
 */
export type MashroomStoragePluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomStorage>;

