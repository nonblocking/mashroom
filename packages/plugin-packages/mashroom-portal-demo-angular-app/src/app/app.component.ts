import {ChangeDetectorRef, Component, Inject} from '@angular/core';

import {MashroomPortalAppSetup, MashroomPortalClientServices, MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

@Component({
    selector: 'angular-demo-app',
    templateUrl: './app.component.html',
    providers: []
})
export class AppComponent {

    firstName: string;
    resourcesBasePath: string;
    pings: number;
    messageBus: MashroomPortalMessageBus;

    constructor(cdRef: ChangeDetectorRef, @Inject('app.setup') private _appSetup: MashroomPortalAppSetup, @Inject('client.services') private _clientServices: MashroomPortalClientServices) {
        this.resourcesBasePath = _appSetup.resourcesBasePath;
        this.firstName = _appSetup.appConfig.firstName;
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
