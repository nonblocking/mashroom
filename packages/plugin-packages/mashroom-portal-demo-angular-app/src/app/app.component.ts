import {Component, Inject, ChangeDetectorRef} from '@angular/core';

import type {MashroomPortalAppSetup, MashroomPortalClientServices, MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

@Component({
    selector: 'app-mashroom-portal-angular-demo',
    standalone: true,
    templateUrl: './app.component.html',
    providers: []
})
export class AppComponent {

    message: string;
    pingButtonLabel: string | undefined;
    resourcesBasePath: string;
    pings: number;
    messageBus: MashroomPortalMessageBus;

    constructor(cdRef: ChangeDetectorRef, @Inject('app.setup') _appSetup: MashroomPortalAppSetup, @Inject('client.services') private _clientServices: MashroomPortalClientServices) {
        this.resourcesBasePath = _appSetup.resourcesBasePath;
        this.message = _appSetup.appConfig.message;
        this.pingButtonLabel = _appSetup.appConfig.pingButtonLabel;
        this.pings = 0;
        this.messageBus = _clientServices.messageBus;
        this.messageBus.subscribe('ping', () => {
            this.pings++;
            // Angular cannot detect this change automatically
            cdRef.detectChanges();
        });
    }

    sendPing() {
        this.messageBus.publish('ping', {});
    }

}
