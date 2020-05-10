
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageService as MashroomStorageServiceType, MashroomStorage} from '../../type-definitions';
import type {MashroomStorageRegistry} from '../../type-definitions/internal';
import {MashroomStorageCollection} from "../../type-definitions";

const MAX_WAIT_FOR_STORAGE = 30000;

export default class MashroomStorageService implements MashroomStorageServiceType {

    private getStorage: () => Promise<MashroomStorage>;
    private logger: MashroomLogger;

    constructor(providerName: string, storageRegistry: MashroomStorageRegistry, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.portal.service');
        this.getStorage = async (): Promise<MashroomStorage> => {
            let waited = 0;
            let storage = storageRegistry.getStorage(providerName);

            while (!storage && waited < MAX_WAIT_FOR_STORAGE) {
                this.logger.warn('Storage provider not available yet, waiting...');
                await this.waitFor(500);
                waited += 500;
                storage = storageRegistry.getStorage(providerName);
            }

            if (!storage) {
                throw new Error(`No storage provider '${providerName}' found!`);
            }

            return storage;
        };
    }

    async getCollection<T extends {}>(name: string): Promise<MashroomStorageCollection<T>> {
        const storage = await this.getStorage();
        return storage.getCollection<T>(name);
    }

    private async waitFor(ms: number): Promise<void> {
        return new Promise((resolve) => {
           setTimeout(() => resolve(), ms);
        });
    }
}
