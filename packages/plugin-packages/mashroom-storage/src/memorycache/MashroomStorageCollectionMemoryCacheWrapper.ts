
import {createHash} from 'crypto';

import type {MashroomPluginContextHolder, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomMemoryCacheService} from '@mashroom/mashroom-memory-cache/type-definitions';
import type {
    MashroomStorageCollection,
    StorageDeleteResult,
    StorageObject,
    StorageObjectFilter,
    StorageRecord,
    StorageUpdateResult
} from '../../type-definitions';

const CACHE_REGION_PREFIX = 'collection:';
const WARN_NO_CACHE_SERVICE_PERIOD_MS = 60000;
let lastNoCacheServiceWarning = 0;

export default class MashroomStorageCollectionMemoryCacheWrapper<T extends StorageRecord> implements MashroomStorageCollection<T> {

    private readonly logger: MashroomLogger;

    constructor(private name: string, private delegate: MashroomStorageCollection<T>,
                private ttlSec: number, private invalidateOnUpdate: boolean,
                private pluginContextHolder: MashroomPluginContextHolder) {
        this.logger = this.pluginContextHolder.getPluginContext().loggerFactory('mashroom.storage.memorycache');
    }

    async find(filter?: StorageObjectFilter<T>, limit?: number): Promise<Array<StorageObject<T>>> {
       return this.wrapFind([filter, limit], () => {
          return this.delegate.find(filter, limit);
       });
    }

    async findOne(filter: StorageObjectFilter<T>): Promise<StorageObject<T> | null | undefined> {
        return this.wrapFind([filter], () => {
            return this.delegate.findOne(filter);
        });
    }

    async insertOne(item: T): Promise<StorageObject<T>> {
        return this.wrapUpdate(() => {
            return this.delegate.insertOne(item);
        });
    }

    async replaceOne(filter: StorageObjectFilter<T>, newItem: T): Promise<StorageUpdateResult> {
        return this.wrapUpdate(() => {
            return this.delegate.replaceOne(filter, newItem);
        });
    }

    async updateOne(filter: StorageObjectFilter<T>, propertiesToUpdate: Partial<StorageObject<T>>): Promise<StorageUpdateResult> {
        return this.wrapUpdate(() => {
            return this.delegate.updateOne(filter, propertiesToUpdate);
        });
    }

    async deleteOne(filter: StorageObjectFilter<T>): Promise<StorageDeleteResult> {
        return this.wrapUpdate(() => {
            return this.delegate.deleteOne(filter);
        });
    }


    async deleteMany(filter: StorageObjectFilter<T>): Promise<StorageDeleteResult> {
        return this.wrapUpdate(() => {
            return this.delegate.deleteMany(filter);
        });
    }

    private async wrapFind<T>(keys: Array<any>,cb: () => Promise<T>): Promise<T> {
        const memoryCacheService = this.getMemoryCacheService();
        if (memoryCacheService) {
            const [readableKey, key] = this.createKey(keys);
            const hit = await memoryCacheService.get(this.getCacheRegion(), key) as T;
            if (hit) {
                this.logger.debug(`Cache hit in collection cache ${this.name} for key: ${readableKey}`);
                return hit;
            }
            const result = await cb();
            this.logger.debug(`Adding key to collection cache ${this.name}: ${readableKey}`);
            await memoryCacheService.set(this.getCacheRegion(), key, result, this.ttlSec);
            return result;
        }

        return cb();
    }

    private async wrapUpdate<T>(cb: () => Promise<T>): Promise<T> {
        if (this.invalidateOnUpdate) {
            const memoryCacheService = this.getMemoryCacheService();
            if (memoryCacheService) {
                this.logger.debug(`Invalidate cache for ${this.name} because of an update`);
                await memoryCacheService.clear(this.getCacheRegion());
            }
        }
        return cb();
    }

    private getCacheRegion(): string {
        return CACHE_REGION_PREFIX + this.name;
    }

    private getMemoryCacheService(): MashroomMemoryCacheService | undefined {
        if (this.pluginContextHolder.getPluginContext().services.memorycache) {
            return this.pluginContextHolder.getPluginContext().services.memorycache.service;
        }
        if (lastNoCacheServiceWarning < Date.now() - WARN_NO_CACHE_SERVICE_PERIOD_MS) {
            this.logger.warn(`Caching for collection '${this.name}' enabled but MashroomMemoryCacheService not (yet) available!`);
            lastNoCacheServiceWarning = Date.now();
        }
        return undefined;
    }

    private createKey(args: Array<any>): [string, string]  {
        const data = args
            .map((a) => a ? a : 'undefined')
            .map((a) => JSON.stringify(a))
            .join('_');
        return [data, createHash('md5').update(data).digest('hex')];
    }

}

