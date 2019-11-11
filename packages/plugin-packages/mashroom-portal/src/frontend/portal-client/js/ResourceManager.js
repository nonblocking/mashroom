// @flow

import type {LoadedPortalAppInternal} from './MashroomPortalAppServiceImpl';
import type {MashroomPortalRemoteLogger} from '../../../../type-definitions';

type Resources<T> = {
    [path: string]: {
        elem: T,
        loaded: boolean,
        onLoadCallbacks: Array<() => void>;
        onErrorCallbacks: Array<() => void>;
        refs: Array<LoadedPortalAppInternal>
    }
}

const LOADED_JS_RESOURCES: Resources<HTMLScriptElement> = {};
const LOADED_CSS_RESOURCES: Resources<HTMLLinkElement> = {};

export default class ResourceManager {

    _htmlDoc: Document;
    _remoteLogger: MashroomPortalRemoteLogger;

    constructor(remoteLogger: MashroomPortalRemoteLogger, htmlDoc?: Document = document) {
        this._remoteLogger = remoteLogger;
        this._htmlDoc = htmlDoc;
    }

    loadJs(path: string, loadedPortalApp: LoadedPortalAppInternal): Promise<void> {
        return new Promise((resolve, reject) => {
            const existingResource = LOADED_JS_RESOURCES[path];
            if (existingResource) {
                console.info('JS resource is already loaded: ', path);
                if (existingResource.refs.indexOf(loadedPortalApp) === -1) {
                    existingResource.refs.push(loadedPortalApp);
                }
                if (!existingResource.loaded) {
                    existingResource.onLoadCallbacks.push(resolve);
                    existingResource.onErrorCallbacks.push(resolve);
                } else {
                    resolve();
                }
                return;
            }

            console.info('Loading JS resource: ', path);
            const scriptElem = this._htmlDoc.createElement('script');
            const resource = {
                elem: scriptElem,
                loaded: false,
                onLoadCallbacks: [resolve],
                onErrorCallbacks: [reject],
                refs: [loadedPortalApp]
            };

            scriptElem.src = path;
            scriptElem.addEventListener('error', (error: any) => {
                console.error('Error loading JS resource: ', path, error);
                this._remoteLogger.error('Error loading JS resource: ' + path, error, loadedPortalApp.pluginName);
                delete LOADED_JS_RESOURCES[path];
                resource.onErrorCallbacks.forEach((cb) => cb());
            });
            scriptElem.addEventListener('load', () => {
                resource.loaded = true;
                resource.onLoadCallbacks.forEach((cb) => cb());
            });
            this._htmlDoc.head ? this._htmlDoc.head.appendChild(scriptElem) : null;

            LOADED_JS_RESOURCES[path] = resource;
        });
    }

    loadStyle(path: string, loadedPortalApp: LoadedPortalAppInternal): void {
        const resource = LOADED_CSS_RESOURCES[path];
        if (resource) {
            console.info('CSS resource is already loaded: ', path);
            resource.refs.push(loadedPortalApp);
            return;
        }

        console.info('Loading CSS resource: ', path);
        const linkElem = this._htmlDoc.createElement('link');
        linkElem.rel = 'stylesheet';
        linkElem.href = path;
        linkElem.addEventListener('error', (error: any) => {
            console.error('Error loading style sheet: ', path, error);
            this._remoteLogger.error('Error loading style sheet: ' + path, error, loadedPortalApp.pluginName);
            delete LOADED_CSS_RESOURCES[path];
        });
        this._htmlDoc.head ? this._htmlDoc.head.appendChild(linkElem) : null;

        LOADED_CSS_RESOURCES[path] = {
            elem: linkElem,
            loaded: true,
            onLoadCallbacks: [],
            onErrorCallbacks: [],
            refs: [loadedPortalApp]
        };
    }

    unloadAppResources(loadedPortalApp: LoadedPortalAppInternal) {
        const unloadResources = (resources) => {
            for (const path in resources) {
                if (resources.hasOwnProperty(path)) {
                    const resource = LOADED_JS_RESOURCES[path];
                    if (resource) {
                        const idx = resource.refs.indexOf(loadedPortalApp);
                        if (idx !== -1) {
                            resource.refs.splice(idx, 1);
                            if (resource.refs.length === 0) {
                                console.info('Removing resource because it is no longer referenced: ', path);
                                resource.elem.parentElement ? resource.elem.parentElement.removeChild(resource.elem) : null;
                                delete resources[path];
                            }
                        }
                    }
                }
            }
        };

        unloadResources(LOADED_JS_RESOURCES);
        unloadResources(LOADED_CSS_RESOURCES);
    }
}
