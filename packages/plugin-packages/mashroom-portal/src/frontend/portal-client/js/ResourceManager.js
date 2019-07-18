// @flow

import type {LoadedPortalAppInternal} from './MashroomPortalAppServiceImpl';
import type {MashroomPortalRemoteLogger, MashroomRestService} from '../../../../type-definitions';

type LoadedResources<T> = {
    [path: string]: {
        elem: T,
        refs: Array<LoadedPortalAppInternal>
    }
}

const LOADED_JS_RESOURCES: LoadedResources<HTMLScriptElement> = {};
const LOADED_CSS_RESOURCES: LoadedResources<HTMLLinkElement> = {};

export default class ResourceManager {

    _remoteLogger: MashroomPortalRemoteLogger;

    constructor(restService: MashroomRestService, remoteLogger: MashroomPortalRemoteLogger) {
        this._remoteLogger = remoteLogger;
    }

    loadJs(path: string, loadedPortalApp: LoadedPortalAppInternal): Promise<void> {
        return new Promise((resolve, reject) => {
            const loadedResource = LOADED_JS_RESOURCES[path];
            if (loadedResource) {
                console.info('JS resource is already loaded: ', path);
                loadedResource.refs.push(loadedPortalApp);
                if (loadedPortalApp.appSetup && window[loadedPortalApp.appSetup.globalLaunchFunction]) {
                    resolve();
                } else {
                    loadedResource.elem.addEventListener('load', () => resolve());
                    loadedResource.elem.addEventListener('error', () => reject());
                }
                return;
            }

            console.info('Loading JS resource: ', path);
            const scriptElem = document.createElement('script');
            scriptElem.src = path;
            scriptElem.addEventListener('error', (error: any) => {
                console.error('Error loading JS resource: ', path, error);
                this._remoteLogger.error('Error loading JS resource: ' + path, error, loadedPortalApp.pluginName);
                delete LOADED_JS_RESOURCES[path];
                reject(error)
            });
            scriptElem.addEventListener('load', () => resolve());
            document.head ? document.head.appendChild(scriptElem) : null;

            LOADED_JS_RESOURCES[path] = {
                elem: scriptElem,
                refs: [loadedPortalApp]
            };
        });
    }

    loadStyle(path: string, loadedPortalApp: LoadedPortalAppInternal): void {
        const loadedResource = LOADED_CSS_RESOURCES[path];
        if (loadedResource) {
            console.info('CSS resource is already loaded: ', path);
            loadedResource.refs.push(loadedPortalApp);
            return;
        }

        console.info('Loading CSS resource: ', path);
        const linkElem = document.createElement('link');
        linkElem.rel = 'stylesheet';
        linkElem.href = path;
        linkElem.addEventListener('error', (error: any) => {
            console.error('Error loading style sheet: ', path, error);
            this._remoteLogger.error('Error loading style sheet: ' + path, error, loadedPortalApp.pluginName);
            delete LOADED_CSS_RESOURCES[path];
        });
        document.head ? document.head.appendChild(linkElem) : null;

        LOADED_CSS_RESOURCES[path] = {
            elem: linkElem,
            refs: [loadedPortalApp]
        };
    }

    unloadAppResources(loadedPortalApp: LoadedPortalAppInternal) {
        const unloadResources = (resources) => {
            for (const path in resources) {
                if (resources.hasOwnProperty(path)) {
                    const loadedResource = LOADED_JS_RESOURCES[path];
                    if (loadedResource) {
                        const idx = loadedResource.refs.indexOf(loadedPortalApp);
                        if (idx !== -1) {
                            loadedResource.refs.splice(idx, 1);
                            if (loadedResource.refs.length === 0) {
                                console.info('Removing resource because it is no longer referenced: ', path);
                                loadedResource.elem.parentElement ? loadedResource.elem.parentElement.removeChild(loadedResource.elem) : null;
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
