import type {MashroomPortalApp} from '../../../type-definitions';

export const portalAppContext = (portalApp: MashroomPortalApp): any => {
    let portalAppHost = null;
    if (portalApp.remoteApp && portalApp.resourcesRootUri && portalApp.resourcesRootUri.indexOf('://') !== -1) {
        portalAppHost = portalApp.resourcesRootUri.split('/')[2];
    }
    return {
        portalAppName: portalApp.name,
        portalAppVersion: portalApp.version,
        portalAppHost,
    };
};
