// @flow

import type {MashroomPortalApp} from '../../../type-definitions';

export const portalAppContext = (portalApp: MashroomPortalApp) => {
    return {
      portalAppName: portalApp.name,
      portalAppVersion: portalApp.version
    };
};
