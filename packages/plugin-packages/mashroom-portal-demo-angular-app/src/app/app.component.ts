import {ChangeDetectorRef, Component, Inject} from '@angular/core';

import {MashroomPortalAppSetup, MashroomPortalClientServices, MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

@Component({
    selector: 'app-mashroom-portal-angular-demo',
    templateUrl: './app.component.html',
    providers: []
})
export class AppComponent {

    firstName: string;
    pingButtonLabel: string | undefined;
    resourcesBasePath: string;
    pings: number;
    messageBus: MashroomPortalMessageBus;

    constructor(cdRef: ChangeDetectorRef, @Inject('app.setup') private _appSetup: MashroomPortalAppSetup, @Inject('client.services') private _clientServices: MashroomPortalClientServices) {
        this.resourcesBasePath = _appSetup.resourcesBasePath;
        this.firstName = _appSetup.appConfig.firstName;
        this.pingButtonLabel = _appSetup.appConfig.pingButtonLabel;
        this.pings = 0;
        this.messageBus = _clientServices.messageBus;
        this.messageBus.subscribe('ping', () => {
            this.pings++;
            // Zone.js cannot detect this change
            cdRef.detectChanges();
        });
    }

    sendPing() {
        this.messageBus.publish('ping', {});
    }

}
