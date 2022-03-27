

import type {MashroomPluginConfig, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';

export type MashroomStorageRecord = Record<string, any>;

export type MashroomStorageObject<T extends MashroomStorageRecord> = T & {
    _id: any;
};

type AlternativeType<T> = T extends ReadonlyArray<infer U> ? T | U : T;

type Condition<T> = AlternativeType<T> | MongoLikeFilterOperators<AlternativeType<T>>;

type MongoLikeFilterOperators<T> = {
    readonly $eq?: T;
    readonly $ne?: T;
    readonly $gt?: T;
    readonly $gte?: T;
    readonly $lt?: T;
    readonly $lte?: T;
    readonly $in?: ReadonlyArray<T>;
    readonly $nin?: ReadonlyArray<T>;
    readonly $exists?: boolean;
    readonly $not?: T extends string ? MongoLikeFilterOperators<T> | RegExp : MongoLikeFilterOperators<T>;
    readonly $regex?: T extends string ? RegExp | string : never;
    readonly $options?: string;
}

type MongoLikeRootFilterOperators<T> = {
    readonly $and?: Array<MongoLikeFilter<T>>;
    readonly $or?: Array<MongoLikeFilter<T>>;
}

type MongoLikeFilter<T> = {
    readonly [P in keyof T]?: Condition<T[P]>;
}  & MongoLikeRootFilterOperators<T> & {
    // Nested properties
    readonly [key: string]: any
}

export type MashroomStorageObjectFilter<T extends MashroomStorageRecord> = MongoLikeFilter<T>;

export type MashroomStorageSort<T extends MashroomStorageRecord> = {
    [P in keyof Partial<T>]: 'asc' | 'desc';
}

export type MashroomStorageSearchResult<T> = {
    readonly result: Array<MashroomStorageObject<T>>;
    readonly totalCount: number;
}

export type MashroomStorageUpdateResult = {
    readonly modifiedCount: number;
};

export type MashroomStorageDeleteResult = {
    readonly deletedCount: number;
};

/**
 * Mashroom storage collection
 */
export interface MashroomStorageCollection<T extends MashroomStorageRecord> {
    /**
     * Find all items that match given filter. The filter supports a subset of Mongo's filter operations (like $gt, $regex, ...).
     */
    find(filter?: MashroomStorageObjectFilter<T>, limit?: number, skip?: number, sort?: MashroomStorageSort<T>): Promise<MashroomStorageSearchResult<T>>;

    /**
     * Return the first item that matches the given filter or null otherwise.
     */
    findOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageObject<T> | null | undefined>;

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
    getCollection<T extends MashroomStorageRecord>(name: string): Promise<MashroomStorageCollection<T>>;
}

export interface MashroomStorageService {
    /**
     * Get (or create) the MashroomStorageCollection with given name.
     */
    getCollection<T extends MashroomStorageRecord>(name: string): Promise<MashroomStorageCollection<T>>;
}

/**
 * Bootstrap method definition for storage plugins
 */
export type MashroomStoragePluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomStorage>;
