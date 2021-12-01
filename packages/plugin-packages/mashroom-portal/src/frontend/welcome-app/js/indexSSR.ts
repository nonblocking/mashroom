
import template from './template';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '../../../../type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup) => {
    return template(portalAppSetup.resourcesBasePath, true);
};

export default bootstrap;
