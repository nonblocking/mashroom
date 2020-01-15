import {ApplicationRef, enableProdMode, NgModule} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from "./app/app.component";

if (process.env.NODE_ENV === 'production') {
    enableProdMode();
}

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (hostElement: HTMLElement, portalAppSetup, portalClientServices) => {

    /*
     * We dynamically create a module per Portal App instance
     * otherwise there could only be one instance per page.
     *
     * This approach seems not to work with the AOT compiler!
     * So, if you don't need the same App multiple times on a page replace this by a "static" App module
     * and activate aot in angular.json to reduce the bundle size.
     */
    const DynamicAppModule: any = function() {};
    DynamicAppModule.prototype.ngDoBootstrap = (app: ApplicationRef) => {
        app.bootstrap(AppComponent, hostElement);
    };
    Object.defineProperty (DynamicAppModule, 'name', {value: 'DemoAngularAppModule' + Math.trunc(Math.random() * 1000) });
    DynamicAppModule.annotations = [
        new NgModule({
            imports: [BrowserModule, FormsModule, HttpClientModule],
            declarations: [AppComponent],
            entryComponents: [AppComponent],
            providers: [
                // Pass app config and services
                {provide: 'app.setup', useValue: portalAppSetup},
                {provide: 'client.services', useValue: portalClientServices}
            ]
        })
    ];

    return platformBrowserDynamic().bootstrapModule(DynamicAppModule, {
        /*
         * Disable zone.js because it would be installed globally and Microfrontends shouldn't do that
         */
        ngZone: 'noop',
    }).then(
        (module) => {
            return {
                willBeRemoved: () => {
                    console.info('Destroying Angular module');
                    module.destroy();
                }
            };
        }
    );
};

window['startAngularDemoApp'] = bootstrap;
