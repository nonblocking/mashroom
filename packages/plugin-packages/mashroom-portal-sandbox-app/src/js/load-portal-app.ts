
import getClientServices from './client-services';

import type {
    MashroomPortalAppLifecycleHooks,
    MashroomPortalAppSetup,
} from '@mashroom/mashroom-portal/type-definitions';
import type {MessageBusPortalAppUnderTest} from './types';

const LOADED_SCRIPTS: Array<HTMLScriptElement> = [];
const LOADED_STYLES: Array<HTMLLinkElement> = [];

let loadedAppHooks: MashroomPortalAppLifecycleHooks | null = null;

const loadJs = (path: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        console.info('Loading JS resource: ', path);
        const scriptElem = document.createElement('script');
        if (path.indexOf('.mjs') !== -1) {
            scriptElem.type = 'module';
        }
        scriptElem.src = path;
        scriptElem.addEventListener('error', (error: any) => {
            console.error('Error loading JS resource: ', path, error);
            reject(`Error loading JS resource: ${path}`);
        });
        scriptElem.addEventListener('load', () => resolve());
        if (document.head) {
            document.head.appendChild(scriptElem);
        }

        LOADED_SCRIPTS.push(scriptElem);
    });
};

const loadStyle = (path: string) => {
    console.info('Loading CSS resource: ', path);
    const linkElem = document.createElement('link');
    linkElem.rel = 'stylesheet';
    linkElem.href = path;
    linkElem.addEventListener('error', (error: any) => {
        console.error('Error loading style sheet: ', path, error);
    });
    if (document.head) {
        document.head.appendChild(linkElem);
    }

    LOADED_STYLES.push(linkElem);
};

export default (appName: string, hostElementId: string, setup: MashroomPortalAppSetup, messageBusPortalAppUnderTest: MessageBusPortalAppUnderTest): Promise<void> => {
    try {
        const {sharedResources, resources, resourcesBasePath, globalLaunchFunction, lastReloadTs} = setup;

        let sharedJsResources: Array<Promise<any>> = [];
        if (sharedResources && sharedResources.js) {
            sharedJsResources = sharedResources.js.map((jsResource) => loadJs(`${resourcesBasePath}/${jsResource}?v=${lastReloadTs}`));
        }
        const jsResources = resources.js.map((jsResource) => loadJs(`${resourcesBasePath}/${jsResource}?v=${lastReloadTs}`));

        sharedResources?.css?.map((cssResource) => loadStyle(`${resourcesBasePath}/${cssResource}?v=${lastReloadTs}`));
        resources?.css?.map((cssResource) => loadStyle(`${resourcesBasePath}/${cssResource}?v=${lastReloadTs}`));

        return Promise.all(sharedJsResources).then(
            () => {
                return Promise.all(jsResources).then(
                    () => {
                        const bootstrapFn = (global as any)[globalLaunchFunction];
                        if (!(typeof (bootstrapFn) === 'function')) {
                            return Promise.reject(`Invalid bootstrap function: ${globalLaunchFunction}`);
                        }

                        const wrapperElem = document.getElementById(hostElementId);
                        const hostElem = document.createElement('div');
                        if (wrapperElem) {
                            wrapperElem.innerHTML = '';
                            wrapperElem.appendChild(hostElem);
                        }

                        const clientServices = getClientServices();
                        const messageBus = messageBusPortalAppUnderTest;
                        const modifiedClientServices = {...clientServices, messageBus};

                        const result = bootstrapFn(hostElem, setup, modifiedClientServices);
                        if (result) {
                            if (typeof (result.then) === 'function') {
                                result.then(
                                    (hooks: MashroomPortalAppLifecycleHooks | null) => {
                                        loadedAppHooks = hooks;
                                    }
                                );
                            } else {
                                loadedAppHooks = result;
                            }
                        }
                    },
                );
            }
        ).catch((error) => {
            console.error('Error loading app into sandbox: ', error);
            const wrapperElem = document.getElementById(hostElementId);
            if (wrapperElem) {
                wrapperElem.innerHTML = `<div class="mashroom-portal-app-loading-error">Loading ${appName} failed: ${error}</div>`;
            }
        });
    } catch (e) {
        return Promise.reject(e);
    }
};
