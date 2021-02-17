
import type {Request} from 'express';
import type {
    MashroomPortalApp,
    MashroomPortalAppEnhancementPlugin,
    MashroomPortalAppSetup
} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';

export default class CopyExtraDataPortalAppEnhancementPlugin implements MashroomPortalAppEnhancementPlugin {

    async enhancePortalAppSetup(portalAppSetup: MashroomPortalAppSetup,
                          portalApp: MashroomPortalApp,
                          req: Request): Promise<MashroomPortalAppSetup> {
        const securityService: MashroomSecurityService = req.pluginContext.services.security.service;

        const user = securityService.getUser(req);
        if (!user) {
            return portalAppSetup;
        }

        return {
            ...portalAppSetup,
            user: {
                ...portalAppSetup.user,
                extraData: user.extraData,
            }
        };
    }

}
