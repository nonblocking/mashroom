
import {getVersionHash, getPortalVersionHash} from '../../../src/backend/utils/cache-utils';

describe('cache-utils', () => {

    it('creates a hash from version if not dev mode', () => {
        const hash = getVersionHash('1.0.1', 1654167672489, false);
        expect(hash).toBe('3accddf64b');
    });

    it('creates a hash version and reload timestamp in dev mode', () => {
        const hash = getVersionHash('1.0.1', 1654167672489, true);
        expect(hash).toBe('44dcbb181e');
    });

    it('determines the Portal version hash', () => {
        const hash = getPortalVersionHash(false);
        expect(hash).toBeTruthy();
    });

});
