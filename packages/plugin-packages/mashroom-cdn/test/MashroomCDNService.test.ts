
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomCDNService from '../src/MashroomCDNService';

describe('MashroomCDNService', () => {

    it('returns a random hsot', () => {
        const cdnHosts: Array<string> = [
            '//localhost:7777',
            '//localhost:8888'
        ];

        const cdnService = new MashroomCDNService(cdnHosts, loggingUtils.dummyLoggerFactory);
        const cdnHost = cdnService.getCDNHost();
        const cdnHost2 = cdnService.getCDNHost();
        const cdnHost3 = cdnService.getCDNHost();

        expect(cdnHost).toBe('//localhost:7777');
        expect(cdnHost2).toBe('//localhost:8888');
        expect(cdnHost3).toBe('//localhost:7777');
    });

});

