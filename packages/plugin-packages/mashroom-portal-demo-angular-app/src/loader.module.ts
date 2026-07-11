import {
    NgModule,
    Injector,
    createComponent,
    ComponentRef,
    ApplicationRef,
    DoBootstrap,
    inject,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import type {
    MashroomPortalAppSetup,
    MashroomPortalClientServices,
} from '@mashroom/mashroom-portal/type-definitions';

/*
 * A dummy main module that just loads the actual main module with a specific configuration
 */
@NgModule({
    imports: [BrowserModule],
})
export class LoaderModule implements DoBootstrap {
    private _appRef = inject(ApplicationRef);
    private _injector = inject(Injector);

    // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
    ngDoBootstrap() {
        // Nothing to do because this is just a dummy module
    }

    public loadApp(
        appModule: any,
        hostElement: Element,
        portalAppSetup: MashroomPortalAppSetup,
        portalClientServices: MashroomPortalClientServices,
    ): ComponentRef<AppComponent> {
        const injector = Injector.create({
            providers: [
                { provide: 'host.element', useValue: hostElement },
                { provide: 'app.setup', useValue: portalAppSetup },
                { provide: 'client.services', useValue: portalClientServices },
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
