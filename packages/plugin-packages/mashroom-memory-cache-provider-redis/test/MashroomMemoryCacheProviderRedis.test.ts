import MashroomMemoryCacheProviderRedis from '../src/provider/MashroomMemoryCacheProviderRedis';

const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDel = jest.fn();
const mockKeys = jest.fn();

jest.mock('../src/redis_client', () => ({
    __esModule: true,
    default: () => ({
        get: mockGet,
        set: mockSet,
        del: mockDel,
        keys: mockKeys,
    }),
    getKeyPrefix: () => 'mashroom:',
}));

const loggerFactory: any = () => console;

describe('MashroomMemoryCacheService', () => {

    beforeEach(() => {
        mockGet.mockReset();
        mockSet.mockReset();
        mockDel.mockReset();
        mockKeys.mockReset();
    });

    it('caches data with the given key', async () => {
        const provider = new MashroomMemoryCacheProviderRedis(loggerFactory);

        await provider.set('region1', 'test', { foo: 'bar '}, 22);

        expect(mockSet.mock.calls.length).toBe(1);
        expect(mockSet.mock.calls[0]).toEqual([
            'region1:test',
            '{"foo":"bar "}',
            'EX',
            22
        ]);
    });

    it('lookups data with the given key', async () => {
        const provider = new MashroomMemoryCacheProviderRedis(loggerFactory);

        mockGet.mockReturnValue('{ "foo": 1 }');

        const result = await provider.get('region1', 'test');

        expect(result).toBeTruthy();

        expect(mockGet.mock.calls.length).toBe(1);
        expect(mockGet.mock.calls[0]).toEqual([
            'region1:test'
        ]);
    });

    it('deletes given key', async () => {
        const provider = new MashroomMemoryCacheProviderRedis(loggerFactory);

        await provider.del('region1', 'test');

        expect(mockDel.mock.calls.length).toBe(1);
        expect(mockDel.mock.calls[0]).toEqual([
            'region1:test'
        ]);
    });

    it('clears the whole cache region', async () => {
        const provider = new MashroomMemoryCacheProviderRedis(loggerFactory);

        mockKeys.mockReturnValue(['mashroom:test1', 'mashroom:test2']);

        await provider.clear('region1');

        expect(mockDel.mock.calls.length).toBe(1);
        expect(mockDel.mock.calls[0]).toEqual([
            'test1',
            'test2'
        ]);
    });
});

