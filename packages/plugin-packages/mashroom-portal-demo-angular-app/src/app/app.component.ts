import { Component, ChangeDetectorRef, inject } from '@angular/core';

import type {
    MashroomPortalAppSetup,
    MashroomPortalClientServices,
    MashroomPortalMessageBus,
} from '@mashroom/mashroom-portal/type-definitions';

@Component({
    selector: 'app-mashroom-portal-angular-demo',
    standalone: true,
    templateUrl: './app.component.html',
    providers: [],
})
export class AppComponent {
    private _clientServices = inject<MashroomPortalClientServices>(
        'client.services' as any,
    );

    message: string;
    pingButtonLabel: string | undefined;
    resourcesBasePath: string;
    pings: number;
    messageBus: MashroomPortalMessageBus;

    constructor() {
        const cdRef = inject(ChangeDetectorRef);
        const _appSetup = inject<MashroomPortalAppSetup>('app.setup' as any);
        const _clientServices = this._clientServices;

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
