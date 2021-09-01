
import type {MashroomPortalApp} from '../../../type-definitions';

export const portalAppContext = (portalApp: MashroomPortalApp): any => {
    return {
      portalAppName: portalApp.name,
      portalAppVersion: portalApp.version
    };
};
