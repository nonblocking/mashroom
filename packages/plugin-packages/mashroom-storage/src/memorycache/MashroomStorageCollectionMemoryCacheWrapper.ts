
import {createHash} from 'crypto';

import type {MashroomPluginContextHolder, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomMemoryCacheService} from '@mashroom/mashroom-memory-cache/type-definitions';
import type {
    MashroomStorageCollection,
    MashroomStorageObject,
    MashroomStorageObjectFilter,
    MashroomStorageRecord,
    MashroomStorageSearchResult,
    MashroomStorageUpdateResult,
    MashroomStorageDeleteResult,
    MashroomStorageSort
} from '../../type-definitions';

const CACHE_REGION_PREFIX = 'collection:';
const WARN_NO_CACHE_SERVICE_PERIOD_MS = 60000;
let lastNoCacheServiceWarning = 0;

export default class MashroomStorageCollectionMemoryCacheWrapper<T extends MashroomStorageRecord> implements MashroomStorageCollection<T> {

    private _logger: MashroomLogger;

    constructor(private _name: string, private _delegate: MashroomStorageCollection<T>,
                private _ttlSec: number, private _invalidateOnUpdate: boolean,
                private _pluginContextHolder: MashroomPluginContextHolder) {
        this._logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.storage.memorycache');
    }

    async find(filter?: MashroomStorageObjectFilter<T>, limit?: number, skip?: number, sort?: MashroomStorageSort<T>): Promise<MashroomStorageSearchResult<T>> {
       return this._wrapFind([filter, limit, skip, sort], () => {
          return this._delegate.find(filter, limit, skip, sort);
       });
    }

    async findOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageObject<T> | null | undefined> {
        return this._wrapFind([filter], () => {
            return this._delegate.findOne(filter);
        });
    }

    async insertOne(item: T): Promise<MashroomStorageObject<T>> {
        return this._wrapUpdate(() => {
            return this._delegate.insertOne(item);
        });
    }

    async replaceOne(filter: MashroomStorageObjectFilter<T>, newItem: T): Promise<MashroomStorageUpdateResult> {
        return this._wrapUpdate(() => {
            return this._delegate.replaceOne(filter, newItem);
        });
    }

    async updateOne(filter: MashroomStorageObjectFilter<T>, propertiesToUpdate: Partial<MashroomStorageObject<T>>): Promise<MashroomStorageUpdateResult> {
        return this._wrapUpdate(() => {
            return this._delegate.updateOne(filter, propertiesToUpdate);
        });
    }

    async updateMany(filter: MashroomStorageObjectFilter<T>, propertiesToUpdate: Partial<MashroomStorageObject<T>>): Promise<MashroomStorageUpdateResult> {
        return this._wrapUpdate(() => {
            return this._delegate.updateMany(filter, propertiesToUpdate);
        });
    }

    async deleteOne(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult> {
        return this._wrapUpdate(() => {
            return this._delegate.deleteOne(filter);
        });
    }


    async deleteMany(filter: MashroomStorageObjectFilter<T>): Promise<MashroomStorageDeleteResult> {
        return this._wrapUpdate(() => {
            return this._delegate.deleteMany(filter);
        });
    }

    private async _wrapFind<T>(keys: Array<any>,cb: () => Promise<T>): Promise<T> {
        const memoryCacheService = this._getMemoryCacheService();
        if (memoryCacheService) {
            const [readableKey, key] = this._createKey(keys);
            const hit = await memoryCacheService.get(this._getCacheRegion(), key) as T;
            if (hit) {
                this._logger.debug(`Cache hit in collection cache ${this._name} for key: ${readableKey}`);
                return hit;
            }
            const result = await cb();
            this._logger.debug(`Adding key to collection cache ${this._name}: ${readableKey}`);
            await memoryCacheService.set(this._getCacheRegion(), key, result, this._ttlSec);
            return result;
        }

        return cb();
    }

    private async _wrapUpdate<T>(cb: () => Promise<T>): Promise<T> {
        if (this._invalidateOnUpdate) {
            const memoryCacheService = this._getMemoryCacheService();
            if (memoryCacheService) {
                this._logger.debug(`Invalidate cache for ${this._name} because of an update`);
                await memoryCacheService.clear(this._getCacheRegion());
            }
        }
        return cb();
    }

    private _getCacheRegion(): string {
        return CACHE_REGION_PREFIX + this._name;
    }

    private _getMemoryCacheService(): MashroomMemoryCacheService | undefined {
        if (this._pluginContextHolder.getPluginContext().services.memorycache) {
            return this._pluginContextHolder.getPluginContext().services.memorycache.service;
        }
        if (lastNoCacheServiceWarning < Date.now() - WARN_NO_CACHE_SERVICE_PERIOD_MS) {
            this._logger.warn(`Caching for collection '${this._name}' enabled but MashroomMemoryCacheService not (yet) available!`);
            lastNoCacheServiceWarning = Date.now();
        }
        return undefined;
    }

    private _createKey(args: Array<any>): [string, string]  {
        const data = args
            .map((a) => a ? JSON.stringify(a) : '')
            .join('__');
        return [data, createHash('md5').update(data).digest('hex')];
    }

}

