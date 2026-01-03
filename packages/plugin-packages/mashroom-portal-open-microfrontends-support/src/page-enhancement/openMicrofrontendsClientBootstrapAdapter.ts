import type {
    MashroomPortalAppClientBootstrapAdapter,
    MashroomPortalAppPluginBootstrapFunction,
    MashroomPortalAppService,
    MashroomPortalAppSetup
} from '@mashroom/mashroom-portal/type-definitions';
import type {OpenMicrofrontendsRenderer} from '@open-microfrontends/types/OpenMicrofrontendsRenderer';

const adapter: MashroomPortalAppClientBootstrapAdapter = {
    get name() {
        return'OpenMicrofrontends Client Bootstrap Adapter';
    },
    shouldAdapt(portalAppSetup: MashroomPortalAppSetup) {
        return 'hostContext' in portalAppSetup && (portalAppSetup as any).hostContext.openMicrofrontends;
    },
    adapt(orginalBootstrap): MashroomPortalAppPluginBootstrapFunction {
        return async (portalAppHostElement, portalAppSetup, clientServices) => {
            const renderer = orginalBootstrap as unknown as OpenMicrofrontendsRenderer<any>;
            const context: any = {
                ...portalAppSetup,
                messageBus: clientServices.messageBus,
            };

            const result = await renderer(portalAppHostElement, context);
            if (result?.onRemove) {
                return {
                    willBeRemoved: result.onRemove,
                };
            }
            return undefined;
        };
    },
};

const portalAppService: MashroomPortalAppService = (window as any).MashroomPortalServices.portalAppService;
if (portalAppService) {
    portalAppService.registerClientBootstrapAdapter(adapter);
} else {
    console.error('Cannot install OpenMicrofrontends Client Bootstrap Adapter: No Mashroom Portal Services found!');
}

