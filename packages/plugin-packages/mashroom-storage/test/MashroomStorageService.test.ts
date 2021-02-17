
import MashroomStorageService from '../src/services/MashroomStorageService';

import type {MemoryCacheConfig} from '../type-definitions/internal';

describe('MashroomStorageService', () => {

    let storage: any = null;
    const mockGetCollection = jest.fn();
    const myTestStorage: any = {
        getCollection: mockGetCollection,
    }
    const pluginContextHolder: any = {
        getPluginContext: () => ({
            loggerFactory: () => console,
        }),
    };
    const registry: any = {
        getStorage: () => storage,
    }

    beforeEach(() => {
        mockGetCollection.mockReset();
        storage = null;
    });

    it('waits for the storage provider for some time', async () => {
        const cacheConfig: MemoryCacheConfig = {
            enabled: false,
        }

        const service = new MashroomStorageService('My Test Storage', cacheConfig, registry, pluginContextHolder);

        const coll = {};
        mockGetCollection.mockReturnValue(coll)

        setTimeout(() => {
            // Make storage available
            storage = myTestStorage;
        }, 2000);

        const collection = await service.getCollection('collection1');

        expect(collection).toBe(coll);
        expect(mockGetCollection.mock.calls.length).toBe(1);
        expect(mockGetCollection.mock.calls[0][0]).toBe('collection1');
    });

    it('returns a wrapped collection if cache is enabled', async () => {
        const cacheConfig: MemoryCacheConfig = {
            enabled: true,
            ttlSec: 22,
            invalidateOnUpdate: true,
        }

        storage = myTestStorage;
        const service = new MashroomStorageService('My Test Storage', cacheConfig, registry, pluginContextHolder);

        const coll = {};
        mockGetCollection.mockReturnValue(coll)

        setTimeout(() => {
            // Make storage available
            storage = myTestStorage;
        }, 2000);

        const collection = await service.getCollection('collection2');

        expect(collection).not.toBe(coll);
        // @ts-ignore
        expect(collection._ttlSec).toBe(22);
        // @ts-ignore
        expect(collection._invalidateOnUpdate).toBe(true);
        expect(mockGetCollection.mock.calls.length).toBe(1);
        expect(mockGetCollection.mock.calls[0][0]).toBe('collection2');
    });
});
