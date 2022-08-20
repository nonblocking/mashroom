
import MashroomStorageCollectionMemoryCacheWrapper from './MashroomStorageCollectionMemoryCacheWrapper';

import type {MashroomLogger,MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorage, MashroomStorageCollection, MashroomStorageRecord} from '../../type-definitions';
import type {MemoryCacheConfig, MemoryCacheProperties} from '../../type-definitions/internal';

export type CollectionMap = {
    [name: string]: MashroomStorageCollection<any>;
}

const DEFAULT_TTL_SEC = 10;

export default class MashroomStorageMemoryCacheWrapper implements MashroomStorage {

    private _collectionMap: CollectionMap;
    private _logger: MashroomLogger;

    constructor(private _delegate: MashroomStorage, private _config: MemoryCacheConfig, private _pluginContextHolder: MashroomPluginContextHolder) {
        this._collectionMap = {};
        this._logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.storage.memorycache');
    }

    async getCollection<T extends MashroomStorageRecord>(name: string): Promise<MashroomStorageCollection<T>> {
        if (this._collectionMap[name]) {
            return this._collectionMap[name];
        }

        let collection = await this._delegate.getCollection<T>(name);

        try {
            if (this._cacheEnabledForCollection(name)) {
                collection = new MashroomStorageCollectionMemoryCacheWrapper(name, collection, this._ttlSecForCollection(name), this._invalidateOnUpdateForCollection(name), this._pluginContextHolder);
            }
        } catch (e) {
            this._logger.error(`Enabling memory cache for collection '${name}' failed`, e);
        }

        this._collectionMap[name] = collection;
        return collection;
    }

    private _cacheEnabledForCollection(name: string): boolean {
        if (this._config.enabled === true) {
            // Could be disabled per collection
            return this._getCollectionProperties(name).enabled !== false;
        }
        return this._getCollectionProperties(name).enabled === true;
    }

    private _ttlSecForCollection(name: string): number {
        return this._getCollectionProperties(name).ttlSec || this._config.ttlSec || DEFAULT_TTL_SEC;
    }

    private _invalidateOnUpdateForCollection(name: string): boolean {
        if (this._config.invalidateOnUpdate === true) {
            // Could be disabled per collection
            return this._getCollectionProperties(name).invalidateOnUpdate !== false;
        }
        return this._getCollectionProperties(name).invalidateOnUpdate === true;
    }

    private _getCollectionProperties(name: string): MemoryCacheProperties {
        return (this._config.collections && this._config.collections[name]) || {};
    }
}
