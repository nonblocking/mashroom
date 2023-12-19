
import context from '../src/context/global-context';

import MashroomMemoryCacheService from '../src/services/MashroomMemoryCacheService';

const loggerFactory: any = () => console;

describe('MashroomMemoryCacheService', () => {

    it('uses the defined provider', async () => {
        const service = new MashroomMemoryCacheService('my provider', 25, loggerFactory);

        const mockSet = jest.fn();
        const myProviderImpl: any = {
            set: mockSet,
        };
        context.pluginRegistry.register('my provider', myProviderImpl);

        await service.set('reg1', 'test1', 'testVal1');

        expect(mockSet.mock.calls.length).toBe(1);
        expect(mockSet.mock.calls[0][0]).toBe('reg1');
        expect(mockSet.mock.calls[0][1]).toBe('test1');
        expect(mockSet.mock.calls[0][2]).toBe('testVal1');
        expect(mockSet.mock.calls[0][3]).toBe(25);
    });

});
