
import template from './template';

import type {MashroomPortalAppPluginSSLBootstrapFunction} from '../../../../type-definitions';

const bootstrap: MashroomPortalAppPluginSSLBootstrapFunction = (portalAppSetup) => {
    return Promise.resolve(template(portalAppSetup.resourcesBasePath));
};

export default bootstrap;
