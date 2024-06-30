
import {
    NgModule,
    Injector,
    ComponentRef,
    createComponent,
    ApplicationRef,
    DoBootstrap,
} from '@angular/core';
import {MashroomPortalAppSetup, MashroomPortalClientServices} from "@mashroom/mashroom-portal/type-definitions";
import {BrowserModule} from "@angular/platform-browser";
import {AppComponent} from './app/app.component';

/*
 * A dummy main module that just loads the actual main module with a specific configuration
 */
@NgModule({
    imports: [BrowserModule],
})
export class LoaderModule implements DoBootstrap {

    constructor(private _appRef: ApplicationRef, private _injector: Injector) {
    }

    ngDoBootstrap() {
        // Nothing to do because this is just a dummy module
    }

    public loadApp(appModule: any, hostElement: Element, portalAppSetup: MashroomPortalAppSetup, portalClientServices: MashroomPortalClientServices): ComponentRef<AppComponent> {
        const injector = Injector.create({
            providers: [
                {provide: 'host.element', useValue: hostElement },
                {provide: 'app.setup', useValue: portalAppSetup},
                {provide: 'client.services', useValue: portalClientServices},
            ],
            parent: this._injector,
        });

        const componentRef = createComponent(AppComponent, {
            hostElement,
            environmentInjector: this._appRef.injector,
            elementInjector: injector,
        });

        componentRef.changeDetectorRef.detectChanges();

        return componentRef;
    }
}
