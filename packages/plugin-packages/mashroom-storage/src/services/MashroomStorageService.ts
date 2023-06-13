
import MashroomStorageMemoryCacheWrapper from '../memorycache/MashroomStorageMemoryCacheWrapper';

import type {MashroomLogger, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageService as MashroomStorageServiceType, MashroomStorage,MashroomStorageCollection, MashroomStorageRecord} from '../../type-definitions';
import type {MashroomStorageRegistry, MemoryCacheConfig} from '../../type-definitions/internal';

const MAX_WAIT_FOR_STORAGE = 30000;

export default class MashroomStorageService implements MashroomStorageServiceType {

    private _getStorage: () => Promise<MashroomStorage>;
    private _currentStorage: MashroomStorage | undefined;
    private _currentWrappedStorage: MashroomStorage | undefined;
    private _logger: MashroomLogger;

    constructor(providerName: string, memoryCacheConfig: MemoryCacheConfig, storageRegistry: MashroomStorageRegistry, pluginContextHolder: MashroomPluginContextHolder) {
        this._logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.storage.service');
        this._getStorage = async (): Promise<MashroomStorage> => {
            let storage = storageRegistry.getStorage(providerName);

            let waited = 0;
            while (!storage && waited < MAX_WAIT_FOR_STORAGE) {
                this._logger.warn('Storage provider not available yet, waiting...');
                await this._waitFor(500);
                waited += 500;
                storage = storageRegistry.getStorage(providerName);
            }

            if (!storage) {
                throw new Error(`No storage provider '${providerName}' found!`);
            }

            if (storage !== this._currentStorage) {
                this._currentStorage = storage;
                this._currentWrappedStorage = new MashroomStorageMemoryCacheWrapper(storage, memoryCacheConfig, pluginContextHolder);
            }

            return this._currentWrappedStorage!;
        };
    }

    async getCollection<T extends MashroomStorageRecord>(name: string): Promise<MashroomStorageCollection<T>> {
        const storage = await this._getStorage();
        return storage.getCollection<T>(name);
    }

    private async _waitFor(ms: number): Promise<void> {
        return new Promise((resolve) => {
           setTimeout(() => resolve(), ms);
        });
    }
}
