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

    let injectHeadScript: string | undefined;

    // Not sure what result.head would contain, but it is emtpy is this specfic case.
    // If it would contain some markup we could do the following:
    /*
    injectHeadScript = `
        const tpl = document.createElement('template');
        tpl.innerHTML = '${result.head}';
        document.head.appendChild(tpl.content);
    `;
     */

    return {
        html: result.body,
        injectHeadScript,
    };
};

export default bootstrap;
