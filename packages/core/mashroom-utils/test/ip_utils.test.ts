
import {getClientIP, clientIPMatch} from '../src/ip_utils';

describe('ip_utils.getClientIP', () => {

    it('resolves the IP address', () => {
        const req: any = {
           headers: {
               'x-forwarded-for': '1.2.3.4',
           }
        };

        const clientIP = getClientIP(req);

        expect(clientIP).toBeTruthy();
        expect(clientIP).toBe('1.2.3.4');
    });

});

describe('ip_utils.clientIPMatch', () => {

    it('matches ipv4 addresses', () => {
        const req: any = {
            headers: {
                'x-forwarded-for': '1.2.3.4',
            }
        };

        expect(clientIPMatch(req, '1.2.3.4')).toBe(true);
        expect(clientIPMatch(req, '1.2.3.5')).toBe(false);
        expect(clientIPMatch(req, '1.2.3.?')).toBe(true);
        expect(clientIPMatch(req, '1.2.3.*')).toBe(true);
        expect(clientIPMatch(req, '1.**')).toBe(true);
        expect(clientIPMatch(req, '2.**')).toBe(false);
        expect(clientIPMatch(req, ['1.2.3.4', '1.2.3.5'])).toBe(true);
    });

    it('matches ipv6 addresses', () => {
        const req: any = {
            headers: {
                'x-forwarded-for': '2001:0db8:85a3:08d3:1319:8a2e:0370:7344',
            }
        };

        expect(clientIPMatch(req, '2001:0db8:85a3:08d3:1319:8a2e:0370:7344')).toBe(true);
        expect(clientIPMatch(req, '2001:0db8:85a3:08d3:1318:8a2e:0370:7344')).toBe(false);
        expect(clientIPMatch(req, '2001:0db8:85a3:08d3:1319:*:*:7344')).toBe(true);
        expect(clientIPMatch(req, '2001:0db8:**')).toBe(true);
    });

});

