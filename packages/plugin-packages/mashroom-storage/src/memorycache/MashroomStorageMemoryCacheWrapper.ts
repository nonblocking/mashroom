
import MashroomStorageCollectionMemoryCacheWrapper from './MashroomStorageCollectionMemoryCacheWrapper';

import type {MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorage, MashroomStorageCollection, StorageRecord} from '../../type-definitions';
import type {MemoryCacheConfig, MemoryCacheProperties} from '../../type-definitions/internal';
import {MashroomLogger} from '@mashroom/mashroom/type-definitions';

export type CollectionMap = {
    [name: string]: MashroomStorageCollection<any>;
}

const DEFAULT_TTL_SEC = 10;

export default class MashroomStorageMemoryCacheWrapper implements MashroomStorage {

    private readonly collectionMap: CollectionMap;
    private readonly logger: MashroomLogger;

    constructor(private delegate: MashroomStorage, private config: MemoryCacheConfig, private pluginContextHolder: MashroomPluginContextHolder) {
        this.collectionMap = {};
        this.logger = this.pluginContextHolder.getPluginContext().loggerFactory('mashroom.storage.memorycache');
    }

    async getCollection<T extends StorageRecord>(name: string): Promise<MashroomStorageCollection<T>> {
        if (this.collectionMap[name]) {
            return this.collectionMap[name];
        }

        let collection = await this.delegate.getCollection<T>(name);

        try {
            if (this.cacheEnabledForCollection(name)) {
                collection = new MashroomStorageCollectionMemoryCacheWrapper(name, collection, this.ttlSecForCollection(name), this.invalidateOnUpdateForCollection(name), this.pluginContextHolder)
            }
        } catch (e) {
            this.logger.error(`Enabling memory cache for collection '${name}' failed`, e);
        }

        this.collectionMap[name] = collection;
        return collection;
    }

    private cacheEnabledForCollection(name: string): boolean {
        if (this.config.enabled === true) {
            // Could be disabled per collection
            return this.getCollectionProperties(name).enabled !== false;
        }
        return this.getCollectionProperties(name).enabled === true;
    }

    private ttlSecForCollection(name: string): number {
        return this.getCollectionProperties(name).ttlSec || this.config.ttlSec || DEFAULT_TTL_SEC;
    }

    private invalidateOnUpdateForCollection(name: string): boolean {
        if (this.config.invalidateOnUpdate === true) {
            // Could be disabled per collection
            return this.getCollectionProperties(name).invalidateOnUpdate !== false;
        }
        return this.getCollectionProperties(name).invalidateOnUpdate === true;
    }

    private getCollectionProperties(name: string): MemoryCacheProperties {
        return (this.config.collections && this.config.collections[name]) || {};
    }
}
