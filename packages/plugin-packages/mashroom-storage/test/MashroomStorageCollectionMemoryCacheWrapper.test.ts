
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
        expect(mockCacheGet.mock.calls[0][1]).toBe('b67d563af0cb6a08be353788f15779f1');
        expect(mockCacheSet.mock.calls.length).toBe(1);
        expect(mockCacheSet.mock.calls[0][0]).toBe('collection:collection1');
        expect(mockCacheSet.mock.calls[0][1]).toBe('b67d563af0cb6a08be353788f15779f1');
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
        expect(mockCacheGet.mock.calls[0][1]).toBe('2a68d7d6edb0f4d50370a41c1a9d09e6');
        expect(mockCacheSet.mock.calls.length).toBe(0);
    });

    it('creates distinct cache keys', async () => {
        const collection = new MashroomStorageCollectionMemoryCacheWrapper(
            'collection1', targetCollection, 10, true, pluginContextHolder);

        await collection.find({ x: 1, y: 2 });
        await collection.find({ x: 1, y: 2 }, 10);
        await collection.find({ x: 1, y: 2 }, 11);
        await collection.find({ x: 1, y: 2 }, 11, 1);
        await collection.find({ x: 1, y: 2 }, 11, 1, { x: 'asc' });
        await collection.find({ x: 1 });
        await collection.find({ x: '1' });
        await collection.find();

        expect(mockCacheGet.mock.calls[0][1]).toBe('82492f954b15b547fe26b1d52f043ebe');
        expect(mockCacheGet.mock.calls[1][1]).toBe('a9f429cf2c50136c284d8317f87a4ae0');
        expect(mockCacheGet.mock.calls[2][1]).toBe('4014c73a8afe5598d03a667afb4044cf');
        expect(mockCacheGet.mock.calls[3][1]).toBe('9dcbb0b706fb3f7ec1cd472dde3abaa8');
        expect(mockCacheGet.mock.calls[4][1]).toBe('76083ae77c59ee7cadbafea7ace6efe9');
        expect(mockCacheGet.mock.calls[5][1]).toBe('6a1f23d1c4286ceb68f3754d7b2198e1');
        expect(mockCacheGet.mock.calls[6][1]).toBe('e9f4ea702acc90dde002796870b28593');
        expect(mockCacheGet.mock.calls[7][1]).toBe('7c0f6b5eab997392242695c2f98722c7');
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
