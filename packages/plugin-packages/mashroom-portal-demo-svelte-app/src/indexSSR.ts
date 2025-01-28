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

    return result.body;
};

export default bootstrap;
