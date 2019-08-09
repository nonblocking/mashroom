// @flow

import {HOST_ELEMENT_ID} from './components/PortalAppHost';

import type {
    MashroomPortalAppLifecycleHooks,
    MashroomPortalAppSetup, MashroomPortalClientServices,
    MashroomPortalMessageBus
} from '@mashroom/mashroom-portal/type-definitions';

const WINDOW_VAR_PORTAL_SERVICES = 'MashroomPortalServices';

const LOADED_SCRIPTS: Array<HTMLScriptElement> = [];
const LOADED_STYLES: Array<HTMLLinkElement> = [];
let loadedAppHooks: ?MashroomPortalAppLifecycleHooks = null;

const loadJs = (path: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        console.info('Loading JS resource: ', path);
        const scriptElem = document.createElement('script');
        scriptElem.src = path;
        scriptElem.addEventListener('error', (error: any) => {
            console.error('Error loading JS resource: ', path, error);
            reject(error)
        });
        scriptElem.addEventListener('load', () => resolve());
        document.head ? document.head.appendChild(scriptElem) : null;

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
    document.head ? document.head.appendChild(linkElem) : null;

    LOADED_STYLES.push(linkElem);
};

export default (appName: string, areaId: string, setup: MashroomPortalAppSetup, dummyMessageBus: MashroomPortalMessageBus): Promise<void> => {
    try {
        const {resources: {js, css}, resourcesBasePath, globalLaunchFunction} = setup;
        const scripts = js.map((jsResource) => loadJs(`${resourcesBasePath}/${jsResource}?v=${Date.now()}`));
        css && css.map((cssResource) => loadStyle(`${resourcesBasePath}/${cssResource}?v=${Date.now()}`));
        return Promise.all(scripts).then(
            () => {
                const bootstrapFn = window[globalLaunchFunction];
                if (!(typeof (bootstrapFn) === 'function')) {
                    return Promise.reject('Invalid bootstrap function: ' + globalLaunchFunction);
                }

                const wrapperElem = document.getElementById(HOST_ELEMENT_ID);
                const hostElem = document.createElement('div');
                if (wrapperElem) {
                    wrapperElem.innerHTML = '';
                    wrapperElem.appendChild(hostElem);
                }

                const messageBus = dummyMessageBus.getAppInstance('portalAppUnderTest');
                const clientServices: MashroomPortalClientServices = global[WINDOW_VAR_PORTAL_SERVICES] || {};
                const modifiedClientServices = Object.assign({}, clientServices, {
                    messageBus
                });


                const result = bootstrapFn(hostElem, setup, modifiedClientServices);
                if (typeof(result.then) === 'function') {
                    result.then(
                        (hooks) => {
                            loadedAppHooks = hooks
                        }
                    );
                } else {
                    loadedAppHooks = result;
                }
            },
            (error) => {
                console.error('Loading failed', error);
                const wrapperElem = document.getElementById(HOST_ELEMENT_ID);
                if (wrapperElem) {
                    wrapperElem.innerHTML = `<div>Error: ${error}</div>`;
                }
            }
        );
    } catch (e) {
        return Promise.reject(e);
    }
}
