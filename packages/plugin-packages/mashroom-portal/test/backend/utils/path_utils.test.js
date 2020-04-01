// @flow

import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';
import {getSitePath, getApiResourcesBaseUrl} from '../../../src/backend/utils/path_utils';

const portalConfig: any = {
    path: '/portal',
};
setPortalPluginConfig(portalConfig);

describe('path_utils', () => {

    it('resolves the site path', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            }
        };

        expect(getSitePath(req)).toBe('/web1');
    });


    it('resolves the API and resources base URL', () => {
        const req: any = {
            params: {
                sitePath: 'web1',
            }
        };

        expect(getApiResourcesBaseUrl(req)).toBe('/portal/web1/___');
    });

});
