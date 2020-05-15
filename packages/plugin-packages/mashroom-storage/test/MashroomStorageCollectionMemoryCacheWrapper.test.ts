
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
        expect(mockCacheGet.mock.calls[0][1]).toBe('1457f618006cf3bd20d9f7ed42576020');
        expect(mockCacheSet.mock.calls.length).toBe(1);
        expect(mockCacheSet.mock.calls[0][0]).toBe('collection:collection1');
        expect(mockCacheSet.mock.calls[0][1]).toBe('1457f618006cf3bd20d9f7ed42576020');
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
        expect(mockCacheGet.mock.calls[0][1]).toBe('e65a3e30acb022904ef171973bc207ea');
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

        expect(mockCacheGet.mock.calls[0][1]).toBe('35e69effdde98029f6646a044593e3ec');
        expect(mockCacheGet.mock.calls[1][1]).toBe('d70c06fdd31804ae972b8aad9696381f');
        expect(mockCacheGet.mock.calls[2][1]).toBe('04ac2f57897fa45c1c0bf1c16d9709d5');
        expect(mockCacheGet.mock.calls[3][1]).toBe('4af614b65a3b8edf7c2184c9d15e707e');
        expect(mockCacheGet.mock.calls[4][1]).toBe('1d7eaf0b8b336c466e46353776d75f49');
        expect(mockCacheGet.mock.calls[5][1]).toBe('4a1cba137888eca712310134568e839f');
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
