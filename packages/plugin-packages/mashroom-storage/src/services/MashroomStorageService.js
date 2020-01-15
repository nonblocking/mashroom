// @flow

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageService as MashroomStorageServiceType, MashroomStorage} from '../../type-definitions';
import type {MashroomStorageRegistry} from '../../type-definitions/internal';

const MAX_WAIT_FOR_STORAGE = 10000;

export default class MashroomStorageService implements MashroomStorageServiceType {

    _getStorage: () => Promise<MashroomStorage>;
    _logger: MashroomLogger;

    constructor(providerName: string, storageRegistry: MashroomStorageRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.portal.service');
        this._getStorage = async () => {
            let waited = 0;
            let storage = storageRegistry.getStorage(providerName);

            while (!storage && waited < MAX_WAIT_FOR_STORAGE) {
                this._logger.warn('Storage provider not available yet, waiting...');
                await this._waitFor(500);
                waited += 500;
                storage = storageRegistry.getStorage(providerName);
            }

            if (!storage) {
                throw new Error(`No storage provider '${providerName}' found!`);
            }

            return storage;
        };
    }

    async getCollection<T: {}>(name: string) {
        const storage = await this._getStorage();
        return storage.getCollection<any>(name);
    }

    async _waitFor(ms: number) {
        return new Promise((resolve) => {
           setTimeout(() => resolve(), ms);
        });
    }
}
