
import determineHost from '../../src/utils/determine_host';

describe('determine_host', () => {

    it('determines a host without port and forwarding header',  () => {
        const req: any = {
            hostname: 'my-host.at',
            headers: {
                host: 'my-host.at'
            }
        };

        expect(determineHost(req, [])).toEqual({
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

        expect(determineHost(req, [])).toEqual({
            hostname: 'my-host.at',
            port: '8080',
        });
    });

    it('determines a host with forwarding header',  () => {
        const req: any = {
            hostname: 'my-host.at',
            headers: {
                host: 'my-host.at',
                'x-forwarded-host': 'my-original-host.at'
            }
        };

        expect(determineHost(req, ['x-forwarded-host'])).toEqual({
            hostname: 'my-original-host.at',
            port: undefined,
        });
    });

    it('determines a host with forwarding header when it contains multiple entries',  () => {
        const req: any = {
            hostname: 'my-host.at',
            headers: {
                host: 'my-host.at',
                'x-forwarded-host': 'my-original-host.at , just-another-host.at'
            }
        };

        expect(determineHost(req, ['x-forwarded-host'])).toEqual({
            hostname: 'my-original-host.at',
            port: undefined,
        });
    });

    it('determines a host with a port and a forwarding header',  () => {
        const req: any = {
            hostname: 'my-host.at',
            headers: {
                host: 'my-host.at:8080',
                'x-forwarded-host': 'my-original-host.at'
            }
        };

        expect(determineHost(req, ['x-forwarded-host'])).toEqual({
            hostname: 'my-original-host.at',
            port: undefined,
        });
    });

    it('consider the http header priority',  () => {
        const req: any = {
            hostname: 'my-host.at',
            headers: {
                host: 'my-host.at',
                'x-my-custom-host-header': ['the-real-original-host.at', 'another-host.com'],
                'x-forwarded-host': 'my-original-host.at'
            }
        };

        expect(determineHost(req, ['x-my-custom-host-header', 'x-forwarded-host'])).toEqual({
            hostname: 'the-real-original-host.at',
            port: undefined,
        });
    });

    it('determines the host correctly if hostname is undefined',  () => {
        const req: any = {
            headers: {
                host: 'my-host.at:8080'
            }
        };

        expect(determineHost(req, [])).toEqual({
            hostname: 'my-host.at',
            port: '8080',
        });
    });

});


