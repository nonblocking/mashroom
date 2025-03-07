import React from 'react';
import {createRoot} from 'react-dom/client';
import AppGallery from './components/AppGallery';
import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {lang, appConfig: { sandboxPath, showTitle, overrideTitle, excludeCategories, showNotPermittedApps }} = portalAppSetup;
    const {portalAppService} = clientServices;

    const root = createRoot(portalAppHostElement);
    root.render((
        <AppGallery
            lang={lang}
            sandboxPath={sandboxPath}
            showTitle={showTitle}
            overrideTitle={overrideTitle}
            excludeCategories={excludeCategories}
            showNotPermittedApps={showNotPermittedApps}
            portalAppService={portalAppService}
        />
    ));

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startAppGalleryApp = bootstrap;
