import {ChangeDetectorRef, Component, Inject} from '@angular/core';

import {PortalAppSetup, PortalClientServices, MashroomPortalMessageBus} from '../types';

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

    constructor(cdRef: ChangeDetectorRef, @Inject('app.setup') private appSetup: PortalAppSetup, @Inject('client.services') private clientServices: PortalClientServices) {
        this.resourcesBasePath = appSetup.resourcesBasePath;
        this.firstName = appSetup.appConfig.firstName;
        this.pings = 0;
        this.messageBus = clientServices.messageBus;
        this.messageBus.subscribe('ping', () => {
            this.pings++;
            cdRef.detectChanges();
        });
    }

    sendPing() {
        this.messageBus.publish('ping', {});
    }
}
