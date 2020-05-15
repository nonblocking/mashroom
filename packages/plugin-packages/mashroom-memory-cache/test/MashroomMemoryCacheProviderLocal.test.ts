
import MashroomMemoryCacheProviderLocal from '../src/plugins/providers/MashroomMemoryCacheProviderLocal';

describe('MashroomMemoryCacheProviderLocal', () => {

    it('persists a given key/value for given ttl', async () => {
        const provider = new MashroomMemoryCacheProviderLocal();

        await provider.set('reg1', 'test1', 'test1', 2);

        expect(await provider.get('reg1', 'test1')).toBe('test1');
        expect(await provider.get('reg1', 'test2')).toBeFalsy();
        expect(await provider.get('reg2', 'test1')).toBeFalsy();

        const valueAfter1Sec = await new Promise((resolve) => {
            setTimeout(() => resolve(provider.get('reg1', 'test1')), 1000);
        });
        const valueAfter2Sec = await new Promise((resolve) => {
            setTimeout(() => resolve(provider.get('reg1', 'test1')), 2000);
        });
        expect(valueAfter1Sec).toBeTruthy();
        expect(valueAfter2Sec).toBeFalsy();
    });

    it('deletes given key', async () => {
        const provider = new MashroomMemoryCacheProviderLocal();

        await provider.set('reg1', 'test1', 'test1', 20);
        await provider.del('reg1', 'test1');

        expect(await provider.get('reg1', 'test1')).toBeFalsy();
    });

    it('clears the whole region', async () => {
        const provider = new MashroomMemoryCacheProviderLocal();

        await provider.set('reg1', 'test1', 'test1', 20);
        await provider.set('reg1', 'test2', 'test2', 20);

        await provider.clear('reg1');

        expect(await provider.get('reg1', 'test1')).toBeFalsy();
    });

    it('returns the correct entry count', async () => {
        const provider = new MashroomMemoryCacheProviderLocal();

        await provider.set('reg1', 'test1', 'test1', 20);
        await provider.set('reg1', 'test2', 'test2', 20);

        expect(await provider.getEntryCount('reg1')).toBe(2);
    });

});
