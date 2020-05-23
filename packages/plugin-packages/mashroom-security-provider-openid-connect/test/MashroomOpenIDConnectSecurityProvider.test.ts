
import MashroomOpenIDConnectSecurityProvider from '../src/security-provider/MashroomOpenIDConnectSecurityProvider';
import {OICD_AUTH_DATA_SESSION_KEY, OICD_USER_SESSION_KEY} from '../src/constants';

describe('MashroomOpenIDConnectSecurityProvider', () => {

    it('returns the user if the token is not expired', () => {

        const provider = new MashroomOpenIDConnectSecurityProvider('');

        const req: any = {
            session: {
                [OICD_AUTH_DATA_SESSION_KEY]: {
                    tokenSet: {
                        expires_at: Date.now() / 1000 + 2000,
                    }
                },
                [OICD_USER_SESSION_KEY]: {}
            }
        };

        expect(provider.getUser(req)).toBeTruthy();
    });

    it('does not return the user if the token is expired', () => {

        const provider = new MashroomOpenIDConnectSecurityProvider('');

        const req: any = {
            session: {
                [OICD_AUTH_DATA_SESSION_KEY]: {
                    tokenSet: {
                        expires_at: Date.now() / 1000 - 10,
                    }
                },
                [OICD_USER_SESSION_KEY]: {}
            }
        };

        expect(provider.getUser(req)).toBeFalsy();
    });

});
