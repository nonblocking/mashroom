import type {MashroomPortalApp} from '../../../type-definitions';

export const portalAppContext = (portalApp: MashroomPortalApp): any => {
    let portalAppHost = null;
    if (portalApp.remoteApp) {
        portalAppHost = portalApp.packageUrl.host;
    }
    return {
        portalAppName: portalApp.name,
        portalAppVersion: portalApp.version,
        portalAppHost,
    };
};
