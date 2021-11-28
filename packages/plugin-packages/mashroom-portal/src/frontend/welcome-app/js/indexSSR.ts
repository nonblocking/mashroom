
import template from './template';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '../../../../type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup) => {
    return template(portalAppSetup.resourcesBasePath);
};

export default bootstrap;
