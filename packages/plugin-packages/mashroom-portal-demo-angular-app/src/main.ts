import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

import {PortalAppSetup, PortalClientServices} from './types';

if (environment.production) {
    enableProdMode();
}

const bootstrap = (element: HTMLElement, portalAppSetup: PortalAppSetup, portalClientServices: PortalClientServices) => {
    element.innerHTML = `
        <angular-demo-app>
        </angular-demo-app>
    `;

    return platformBrowserDynamic([
        {provide: 'app.setup', useValue: portalAppSetup},
        {provide: 'client.services', useValue: portalClientServices}
    ]).bootstrapModule(AppModule).then(
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
