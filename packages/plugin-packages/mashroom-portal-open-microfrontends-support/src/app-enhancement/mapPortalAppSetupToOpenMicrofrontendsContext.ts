import type {MashroomPortalAppSetup} from '@mashroom/mashroom-portal/type-definitions';
import type {OpenMicrofrontendsClientContext} from '@open-microfrontends/types/OpenMicrofrontendsRenderer';

export default (portalAppSetup: MashroomPortalAppSetup): OpenMicrofrontendsClientContext<any, any, any, undefined, undefined> => {
    const {appId, lang, proxyPaths, user, appConfig, serverSideRendered} = portalAppSetup;

    return {
        id: appId,
        lang,
        user: !user.guest ? {
            username: user.username,
            displayName: user.displayName,
        }: undefined,
        permissions: user.permissions,
        apiProxyPaths: proxyPaths,
        config: appConfig,
        serverSideRendered,
        hostContext: {
            hostApplicationName: 'Mashroom Portal',
            openMicrofrontends: true,
        },
    };
};
