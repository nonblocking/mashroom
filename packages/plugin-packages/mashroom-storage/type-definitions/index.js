// @flow

import type {MashroomPluginConfig, MashroomPluginContextHolder} from "@mashroom/mashroom/type-definitions";

export type MashroomStorageRecord = {};

export type MashroomStorageObject<T: MashroomStorageRecord> = T & {|
    _id: any
|}

export type MashroomStorageObjectFilter<T: MashroomStorageRecord> = any;

export type MashroomStorageSort<T: MashroomStorageRecord> = {
    [$Keys<MashroomStorageObject<T>>]: 'asc' | 'desc',
}

export type MashroomStorageSearchResult<T> = {
    result: Array<MashroomStorageObject<T>>;
    totalCount: number;
}

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
     * Find all items that match given filter. The filter supports a subset of Mongo's filter operations (like $gt, $regex, ...).
     */
    find(filter?: MashroomStorageObjectFilter<T>, limit?: number, skip?: number, sort?: MashroomStorageSort<T>): Promise<MashroomStorageSearchResult<T>>;
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
    updateOne(filter: MashroomStorageObjectFilter<T>, propertiesToUpdate: Partial<MashroomStorageObject<T>>): Promise<MashroomStorageUpdateResult>;
    /**
    * Update multiple entries
    */
    updateMany(filter: MashroomStorageObjectFilter<T>, propertiesToUpdate: Partial<MashroomStorageObject<T>>): Promise<MashroomStorageUpdateResult>;
    /**
     * Replace the first item that matches the given filter.
     */
    replaceOne(filter: MashroomStorageObjectFilter<T>, newItem: T): Promise<MashroomStorageUpdateResult>;
    /**
     * Delete the first item that matches the given filter.
     */
    deleteOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult>;
    /**
     * Delete all items that match the given filter.
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

