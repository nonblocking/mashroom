
import CopyExtraDataPortalAppEnhancementPlugin from './CopyExtraDataPortalAppEnhancementPlugin';
import type {MashroomPortalAppEnhancementPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppEnhancementPluginBootstrapFunction = () => {
    return new CopyExtraDataPortalAppEnhancementPlugin();
};

export default bootstrap;
