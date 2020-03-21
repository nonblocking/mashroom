
import {ComponentFactory, ComponentFactoryResolver, NgModule} from '@angular/core';

import { AppComponent } from './app.component';
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from "@angular/common/http";

@NgModule({
    imports: [FormsModule, HttpClientModule],
    declarations: [AppComponent]
})
export class AppModule {

    constructor(private resolver: ComponentFactoryResolver) {
    }

    public resolveComponentFactory(): ComponentFactory<AppComponent> {
        return this.resolver.resolveComponentFactory(AppComponent);
    }
}
