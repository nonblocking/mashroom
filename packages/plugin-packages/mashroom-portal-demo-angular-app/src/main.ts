import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import {LoaderModule} from "./loader.module";
import {AppModule} from "./app/app.module";

if (process.env.NODE_ENV === 'production') {
    enableProdMode();
}

const bootstrap: MashroomPortalAppPluginBootstrapFunction = async (hostElement, portalAppSetup, portalClientServices) => {

    const loaderModule = await platformBrowserDynamic().bootstrapModule(LoaderModule);

    const componentRef = loaderModule.instance.loadApp(AppModule, hostElement, portalAppSetup, portalClientServices);

    return {
        willBeRemoved: () => {
            console.info('Destroying Angular module');
            componentRef.destroy();
        }
    };
};

window['startAngularDemoApp'] = bootstrap;
