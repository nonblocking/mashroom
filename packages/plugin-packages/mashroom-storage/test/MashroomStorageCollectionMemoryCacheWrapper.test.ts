
import MashroomStorageCollectionMemoryCacheWrapper from '../src/memorycache/MashroomStorageCollectionMemoryCacheWrapper';

describe('MashroomStorageCollectionMemoryCacheWrapper', () => {

    const mockTargetFind = jest.fn();
    const mockTargetUpdateOne = jest.fn();
    const mockTargetDeleteOne = jest.fn();
    const targetCollection: any = {
        find: mockTargetFind,
        updateOne: mockTargetUpdateOne,
    }
    const mockCacheGet = jest.fn();
    const mockCacheSet = jest.fn();
    const mockCacheClear = jest.fn();
    const pluginContextHolder: any = {
        getPluginContext: () => ({
            loggerFactory: () => console,
            services: {
                memorycache: {
                    service: {
                        get: mockCacheGet,
                        set: mockCacheSet,
                        clear: mockCacheClear,
                    }
                }
            }
        }),
    };

    beforeEach(() => {
        mockTargetFind.mockReset();
        mockTargetUpdateOne.mockReset();
        mockTargetDeleteOne.mockReset();
        mockCacheGet.mockReset();
        mockCacheSet.mockReset();
        mockCacheClear.mockReset();
    });

    it('puts find result into the cache', async () => {
        const collection = new MashroomStorageCollectionMemoryCacheWrapper(
            'collection1', targetCollection, 10, true, pluginContextHolder);
        const collectionObject = { foo: 1 };

        mockTargetFind.mockReturnValue(Promise.resolve(collectionObject));

        const result = await collection.find(collectionObject, 2);

        expect(result).toEqual(collectionObject);
        expect(mockCacheGet.mock.calls.length).toBe(1);
        expect(mockCacheGet.mock.calls[0][0]).toBe('collection:collection1');
        expect(mockCacheGet.mock.calls[0][1]).toBe('dff8538968372b755b6514d60a6b0ae0');
        expect(mockCacheSet.mock.calls.length).toBe(1);
        expect(mockCacheSet.mock.calls[0][0]).toBe('collection:collection1');
        expect(mockCacheSet.mock.calls[0][1]).toBe('dff8538968372b755b6514d60a6b0ae0');
        expect(mockCacheSet.mock.calls[0][2]).toEqual(collectionObject)
        expect(mockCacheSet.mock.calls[0][3]).toEqual(10)
    });

    it('returns the value from the cache if any', async () => {
        const collection = new MashroomStorageCollectionMemoryCacheWrapper(
            'collection1', targetCollection, 10, true, pluginContextHolder);
        const collectionObject = { bar: 2 };

        mockCacheGet.mockReturnValue(Promise.resolve(collectionObject));

        const result = await collection.find(collectionObject, 100);

        expect(result).toEqual(collectionObject);
        expect(mockCacheGet.mock.calls.length).toBe(1);
        expect(mockCacheGet.mock.calls[0][0]).toBe('collection:collection1');
        expect(mockCacheGet.mock.calls[0][1]).toBe('221262c70534feb8e1126f700e15f359');
        expect(mockCacheSet.mock.calls.length).toBe(0);
    });

    it('creates distinct cache keys', async () => {
        const collection = new MashroomStorageCollectionMemoryCacheWrapper(
            'collection1', targetCollection, 10, true, pluginContextHolder);

        await collection.find({ x: 1, y: 2 });
        await collection.find({ x: 1, y: 2 }, 10);
        await collection.find({ x: 1, y: 2 }, 11);
        await collection.find({ x: 1 });
        await collection.find({ x: '1' });
        await collection.find();

        expect(mockCacheGet.mock.calls[0][1]).toBe('800f15b68afa9bfbef9459efaf8cfa03');
        expect(mockCacheGet.mock.calls[1][1]).toBe('c69e3bf430400b632339d6ff38c9a8b4');
        expect(mockCacheGet.mock.calls[2][1]).toBe('7222dd406548326ca6c1d5caaa47352a');
        expect(mockCacheGet.mock.calls[3][1]).toBe('00662d87e5c40066d67b858bf964bc07');
        expect(mockCacheGet.mock.calls[4][1]).toBe('dfe6f1317736139398887eb5279a7153');
        expect(mockCacheGet.mock.calls[5][1]).toBe('18f05aeddc212b523b40818fa2b87b33');
    })

    it('invalidates the cache on update', async () => {
        const collection = new MashroomStorageCollectionMemoryCacheWrapper(
            'collection2', targetCollection, 10, true, pluginContextHolder);

        await collection.updateOne({ x: 2 }, { y: 1});

        expect(mockCacheClear.mock.calls.length).toBe(1);
        expect(mockCacheClear.mock.calls[0][0]).toBe('collection:collection2');
    });

    it('doesnt invalidate on update if invalidateOnUpdate is false', async () => {
        const collection = new MashroomStorageCollectionMemoryCacheWrapper(
            'collection2', targetCollection, 10, false, pluginContextHolder);

        await collection.updateOne({ x: 2 }, { y: 1});

        expect(mockCacheClear.mock.calls.length).toBe(0);
    });

});
