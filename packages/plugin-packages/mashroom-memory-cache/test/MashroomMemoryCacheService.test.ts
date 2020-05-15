
import {LOCAL_MEMORY_CACHE_PROVIDER_NAME} from '../src/constants';
import context from '../src/context/global_context';

import MashroomMemoryCacheService from '../src/services/MashroomMemoryCacheService';


const loggerFactory: any = () => console;

describe('MashroomMemoryCacheService', () => {

    it('uses the defined provider', async () => {
        const service = new MashroomMemoryCacheService('my provider', 25, loggerFactory);

        const mockSet = jest.fn();
        const myProviderImpl: any = {
            set: mockSet,
        }
        context.pluginRegistry.register('my provider', myProviderImpl);

        await service.set('reg1', 'test1', 'testVal1');

        expect(mockSet.mock.calls.length).toBe(1);
        expect(mockSet.mock.calls[0][0]).toBe('reg1');
        expect(mockSet.mock.calls[0][1]).toBe('test1');
        expect(mockSet.mock.calls[0][2]).toBe('testVal1');
        expect(mockSet.mock.calls[0][3]).toBe(25);
    });

    it('calculates statistics', async () => {
        const service = new MashroomMemoryCacheService(LOCAL_MEMORY_CACHE_PROVIDER_NAME, 25, loggerFactory);

        await service.set('reg1', 'test1', 'test1');
        await service.set('reg1', 'test2', 'test2');
        await service.set('reg2', 'test1', 'test1');

        await service.get('reg1', 'test1');
        await service.get('reg1', 'test1');
        await service.get('reg1', 'test1');
        await service.get('reg1', 'test5');

        expect(service.getStats()).toEqual({
            'cacheHitRatio': 0.75,
            'entriesAdded': 3,
            'regionCount': 2
        });
    });

});
