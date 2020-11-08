
import MashroomStorageMemoryCacheWrapper from '../memorycache/MashroomStorageMemoryCacheWrapper';

import type {MashroomLogger, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageService as MashroomStorageServiceType, MashroomStorage} from '../../type-definitions';
import type {MashroomStorageRegistry, MemoryCacheConfig} from '../../type-definitions/internal';
import type {MashroomStorageCollection, StorageRecord} from '../../type-definitions';

const MAX_WAIT_FOR_STORAGE = 30000;

export default class MashroomStorageService implements MashroomStorageServiceType {

    private readonly getStorage: () => Promise<MashroomStorage>;
    private currentStorage: MashroomStorage | undefined;
    private currentWrappedStorage: MashroomStorage | undefined;
    private readonly logger: MashroomLogger;

    constructor(providerName: string, memoryCacheConfig: MemoryCacheConfig, storageRegistry: MashroomStorageRegistry, pluginContextHolder: MashroomPluginContextHolder) {
        this.logger = pluginContextHolder.getPluginContext().loggerFactory('mashroom.storage.service');
        this.getStorage = async (): Promise<MashroomStorage> => {
            let storage = storageRegistry.getStorage(providerName);

            let waited = 0;
            while (!storage && waited < MAX_WAIT_FOR_STORAGE) {
                this.logger.warn('Storage provider not available yet, waiting...');
                await this.waitFor(500);
                waited += 500;
                storage = storageRegistry.getStorage(providerName);
            }

            if (!storage) {
                throw new Error(`No storage provider '${providerName}' found!`);
            }

            if (storage !== this.currentStorage) {
                this.currentStorage = storage;
                this.currentWrappedStorage = new MashroomStorageMemoryCacheWrapper(storage, memoryCacheConfig, pluginContextHolder);
            }

            // @ts-ignore
            return this.currentWrappedStorage;
        };
    }

    async getCollection<T extends StorageRecord>(name: string): Promise<MashroomStorageCollection<T>> {
        const storage = await this.getStorage();
        return storage.getCollection<T>(name);
    }

    private async waitFor(ms: number): Promise<void> {
        return new Promise((resolve) => {
           setTimeout(() => resolve(), ms);
        });
    }
}
