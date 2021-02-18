
import MashroomStorageMemoryCacheWrapper from '../src/memorycache/MashroomStorageMemoryCacheWrapper';
import MashroomStorageCollectionMemoryCacheWrapper from '../src/memorycache/MashroomStorageCollectionMemoryCacheWrapper';

import type {MemoryCacheConfig} from '../type-definitions/internal';

describe('MashroomStorageMemoryCacheWrapper', () => {

    const config: MemoryCacheConfig = {
        enabled: true,
        ttlSec: 100,
        invalidateOnUpdate: false,
        collections: {
            collection1: {
                enabled: true,
                ttlSec: 10,
                invalidateOnUpdate: true,
            },
            collection3: {
                enabled: false,
            },
        }
    }
    const mockGetCollection = jest.fn();
    const storage: any = {
        getCollection: mockGetCollection,
    }
    const pluginContextHolder: any = {
        getPluginContext: () => ({
            loggerFactory: () => console,
        }),
    };

    beforeEach(() => {
        mockGetCollection.mockReset();
    });

    it('it wraps the collections with MashroomStorageCollectionMemoryCacheWrapper', async () => {
        const wrapper = new MashroomStorageMemoryCacheWrapper(storage, config, pluginContextHolder);

        const collection = await wrapper.getCollection('collection1');

        expect(collection).toBeTruthy();
        expect(collection instanceof MashroomStorageCollectionMemoryCacheWrapper).toBeTruthy();
        // @ts-ignore
        expect(collection._ttlSec).toBe(10);
        // @ts-ignore
        expect(collection._invalidateOnUpdate).toBe(true);
        expect(mockGetCollection.mock.calls.length).toBe(1);
    });

    it('takes the defaults if no collection specific config given', async () => {
        const wrapper = new MashroomStorageMemoryCacheWrapper(storage, config, pluginContextHolder);

        const collection = await wrapper.getCollection('collection2');

        expect(collection instanceof MashroomStorageCollectionMemoryCacheWrapper).toBeTruthy();
        // @ts-ignore
        expect(collection._ttlSec).toBe(100);
        // @ts-ignore
        expect(collection._invalidateOnUpdate).toBe(false);
    });

    it('does not wrap the collection if enabled is false', async () => {
        const wrapper = new MashroomStorageMemoryCacheWrapper(storage, config, pluginContextHolder);

        const collection = await wrapper.getCollection('collection3');

        expect(collection instanceof MashroomStorageCollectionMemoryCacheWrapper).toBeFalsy();
    });

});

