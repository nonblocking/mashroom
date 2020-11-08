
import type {MashroomPortalPageEnhancementPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalPageEnhancementPluginBootstrapFunction = () => {
    return {
        rules: {
            isLegacyBrowser: (sitePath, pageFriendlyUrl, lang, userAgent) => userAgent.browser.name === 'IE',
        }
    }
};

export default bootstrap;

