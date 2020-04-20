
import determineHost from '../../src/middleware/determine_host';

describe('determine_host', () => {

    it('determines a host without port and forwarding header',  () => {
        const req: any = {
            hostname: 'my-host.at',
            headers: {
                host: 'my-host.at'
            }
        };

        expect(determineHost(req)).toEqual({
            hostname: 'my-host.at',
            port: undefined,
        });
    });

    it('determines a host with forwarding header',  () => {
        const req: any = {
            // hostname differs because of a X-Forwarded-Host header
            hostname: 'my-host.at',
            headers: {
                host: 'my-original-host.at'
            }
        };

        expect(determineHost(req)).toEqual({
            hostname: 'my-host.at',
            port: undefined,
        });
    });

    it('determines a host with a port',  () => {
        const req: any = {
            hostname: 'my-host.at',
            headers: {
                host: 'my-host.at:8080'
            }
        };

        expect(determineHost(req)).toEqual({
            hostname: 'my-host.at',
            port: '8080',
        });
    });


    it('determines a host with a port and a forwarding header',  () => {
        const req: any = {
            hostname: 'my-host.at',
            headers: {
                host: 'my-original-host.at:8080'
            }
        };

        expect(determineHost(req)).toEqual({
            hostname: 'my-host.at',
            port: undefined,
        });
    });

});


