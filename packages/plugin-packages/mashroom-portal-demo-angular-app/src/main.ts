import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import {LoaderModule} from "./loader.module";
import {AppComponent} from "./app/app.component";

if (process.env.NODE_ENV === 'production') {
    enableProdMode();
}

const bootstrap: MashroomPortalAppPluginBootstrapFunction = async (hostElement, portalAppSetup, portalClientServices) => {

    const loaderModule = await platformBrowserDynamic().bootstrapModule(LoaderModule, {
        ngZone: 'noop'
    });

    const componentRef = loaderModule.instance.loadApp(AppComponent, hostElement, portalAppSetup, portalClientServices);

    return {
        willBeRemoved: () => {
            console.info('Destroying Angular module');
            componentRef.destroy();
        }
    };
};

window['startAngularDemoApp'] = bootstrap;
