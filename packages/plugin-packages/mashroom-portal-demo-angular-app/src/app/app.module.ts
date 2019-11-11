import {ApplicationRef, Inject, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {AppComponent} from './app.component';

@NgModule({
    imports: [BrowserModule, FormsModule, HttpClientModule],
    declarations: [AppComponent],
    entryComponents: [AppComponent],
    providers: []
})
export class AppModule {

    hostElement: HTMLElement;

    constructor(@Inject('host.element') private hostElem: HTMLElement) {
        this.hostElement = hostElem;
    }

    ngDoBootstrap(app: ApplicationRef) {
        app.bootstrap(AppComponent, this.hostElement);
    }
}
