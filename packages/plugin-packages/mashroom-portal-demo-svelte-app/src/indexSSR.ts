import { render } from 'svelte/server';
import App from './App.svelte';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup) => {
    const result = render(App, {
        props: {
            messageBus: undefined,
            appConfig: portalAppSetup.appConfig,
        }
    });

    return {
        html: result.body,
        // It seems result.head is empty in this case. Also, not sure if it would actually contain a script
        // injectHeadScript: result.head,
    };
};

export default bootstrap;
