import mapPortalAppSetupToOpenMicrofrontendsContext from './mapPortalAppSetupToOpenMicrofrontendsContext';
import type {MashroomPortalApp, MashroomPortalAppEnhancementPlugin, MashroomPortalAppSetup} from '@mashroom/mashroom-portal/type-definitions';
import type {Request} from 'express';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';

export default class MashroomOpenMicrofrontendsMashroomPortalAppEnhancementPlugin implements MashroomPortalAppEnhancementPlugin {

    #logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this.#logger = loggerFactory('mashroom.portal.open-microfrontends');
    }

    async enhancePortalAppSetup(portalAppSetup: MashroomPortalAppSetup, portalApp: MashroomPortalApp, request: Request): Promise<MashroomPortalAppSetup> {
        if (portalApp.metaInfo?.openMicrofrontends) {
            this.#logger.debug(`Mapping setup to OpenMicrofrontends context for App ${portalApp.name}`);
            const context = mapPortalAppSetupToOpenMicrofrontendsContext(portalAppSetup);
            return {
                ...portalAppSetup,
                ...context,
                user: {
                    ...portalAppSetup.user,
                    ...context.user,
                },
            };
        }

        return portalAppSetup;
    }

}
