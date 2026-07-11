import {enableProdMode} from '@angular/core';
import {platformBrowser} from '@angular/platform-browser';

import {LoaderModule} from './loader.module';
import {AppComponent} from './app/app.component';
import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

if (process.env.NODE_ENV === 'production') {
    enableProdMode();
}

const bootstrap: MashroomPortalAppPluginBootstrapFunction = async (hostElement, portalAppSetup, portalClientServices) => {

    const loaderModule = await platformBrowser().bootstrapModule(LoaderModule, {
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

(window as any)['startAngularDemoApp'] = bootstrap;
