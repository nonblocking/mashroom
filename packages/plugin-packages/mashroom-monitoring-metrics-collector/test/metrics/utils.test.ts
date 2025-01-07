import {getRouteLabel} from '../../src/metrics/utils';

describe('utils.getRouteLabel', () => {

    const logger: any = console;

    it('aggregates API routes', () => {
        expect(getRouteLabel('/portal/web/___/api/apps/my-app/whatever', logger)).toBe('/portal/web/___/api/apps');
    });

    it('aggregates proxy routes', () => {
        expect(getRouteLabel('/portal/web/___/proxy/my-app/bff/customer/1', logger)).toBe('/portal/web/___/proxy/my-app/bff');
    });

    it('aggregates theme routes', () => {
        expect(getRouteLabel('/portal/web/___/theme/my-theme/assets/logo.png', logger)).toBe('/portal/web/___/theme/my-theme');
    });

    it('aggregates app resource routes', () => {
        expect(getRouteLabel('/portal/web/___/apps/my-app/bundle.js', logger)).toBe('/portal/web/___/apps/my-app');
    });

    it('aggregates page enhancement routes', () => {
        expect(getRouteLabel('/portal/web/___/page-enhancements/my-page-enhancement/index.ts', logger)).toBe('/portal/web/___/page-enhancements/my-page-enhancement');
    });

    it('removes values from the route', () => {
        expect(getRouteLabel('/my-api/customers/123456', logger)).toBe('/my-api/customers/#val');
    });
});
