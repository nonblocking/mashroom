
import {
    NgModule,
    Injector,
    ɵcreateInjector as createInjector,
    ComponentRef
} from '@angular/core';
import {MashroomPortalAppSetup, MashroomPortalClientServices} from "@mashroom/mashroom-portal/type-definitions";
import {BrowserModule} from "@angular/platform-browser";

/*
 * A dummy main module that just loads the actual main module with a specific configuration
 */
@NgModule({
    imports: [BrowserModule],
})
export class LoaderModule {

    constructor(private _injector: Injector) {
    }

    ngDoBootstrap() {
        // Nothing to do because this is just a dummy module
    }

    public loadApp(appModule: any, hostElement: Node, portalAppSetup: MashroomPortalAppSetup, portalClientServices: MashroomPortalClientServices): ComponentRef<any> {
        const moduleInjector = createInjector(appModule, this._injector, [
            {provide: 'host.element', useValue: hostElement },
            {provide: 'app.setup', useValue: portalAppSetup},
            {provide: 'client.services', useValue: portalClientServices},
        ]);

        const appModuleInstance = moduleInjector.get(appModule);
        const componentFactory = appModuleInstance.resolveComponentFactory();
        const componentRef = componentFactory.create(moduleInjector, null, hostElement);
        componentRef.changeDetectorRef.detectChanges();

        return componentRef;
    }
}
