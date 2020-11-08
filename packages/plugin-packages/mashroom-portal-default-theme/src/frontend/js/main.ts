
// Clientside JavaScript

import type {MashroomPortalClientServices} from '@mashroom/mashroom-portal/type-definitions';

const glob = global as any;

glob.toggleMenu = () => {
    document.querySelector('nav')?.classList.toggle('show');
}

glob.toggleShowAppVersions = () => {
    const clientServices: MashroomPortalClientServices | undefined = glob.MashroomPortalServices;
    if (!clientServices) {
        return;
    }
    if (document.querySelector('.mashroom-portal-app-info')) {
        clientServices.portalAppService.hideAppInfos()
    } else {
        clientServices.portalAppService.showAppInfos()
    }
}
