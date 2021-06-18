import type {MashroomPortalClientServices} from '@mashroom/mashroom-portal/type-definitions';

const WINDOW_VAR_PORTAL_SERVICES = 'MashroomPortalServices';

export default (): MashroomPortalClientServices => {
    return (global as any)[WINDOW_VAR_PORTAL_SERVICES] || {};
}
