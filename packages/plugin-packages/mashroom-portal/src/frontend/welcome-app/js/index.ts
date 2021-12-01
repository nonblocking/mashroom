
import template from './template';

import type {MashroomPortalAppPluginBootstrapFunction} from '../../../../type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (element, portalAppSetup) => {
    if (!element.querySelector('.welcome-app-content')) {
        element.innerHTML = template(portalAppSetup.resourcesBasePath);
    }
    return Promise.resolve();
};

(global as any).startWelcomeApp = bootstrap;
