import {ApplicationRef, enableProdMode, NgModule} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {PortalAppSetup, PortalClientServices} from './types';
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from "./app/app.component";

if (process.env.NODE_ENV === 'production') {
    enableProdMode();
}

const bootstrap = (hostElement: HTMLElement, portalAppSetup: PortalAppSetup, portalClientServices: PortalClientServices) => {

    /*
     * We dynamically create a module per Portal App instance
     * otherwise there could only be one instance per page
     */
    const DynamicAppModule: any = function() {};
    DynamicAppModule.prototype.ngDoBootstrap = (app: ApplicationRef) => {
        app.bootstrap(AppComponent, hostElement);
    };
    Object.defineProperty (DynamicAppModule, 'name', {value: 'Random' + Math.trunc(Math.random() * 100000) });
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

    return platformBrowserDynamic().bootstrapModule(DynamicAppModule).then(
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
