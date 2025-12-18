
import getClientServices from './client-services';

import type {
    MashroomPortalAppLifecycleHooks,
    MashroomPortalAppSetup,
} from '@mashroom/mashroom-portal/type-definitions';
import type {MessageBusPortalAppUnderTest} from './types';

const LOADED_SCRIPTS: Array<HTMLScriptElement> = [];
const LOADED_STYLES: Array<HTMLLinkElement> = [];
let loadedAppHooks: MashroomPortalAppLifecycleHooks | null = null;

const loadJs = async (path: string): Promise<void> => {
    console.info('Loading JS resource: ', path);
    const scriptElem = document.createElement('script');
    if (path.indexOf('.mjs') !== -1) {
        scriptElem.type = 'module';
    }
    scriptElem.src = path;

    document.head.appendChild(scriptElem);

    await new Promise<void>((resolve, reject) => {
        scriptElem.addEventListener('error', (error: any) => {
            console.error('Error loading JS resource: ', path, error);
            reject(`Error loading JS resource: ${path}`);
        });
        scriptElem.addEventListener('load', () => resolve());
    });

    LOADED_SCRIPTS.push(scriptElem);
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

export default async (appName: string, hostElementId: string, setup: MashroomPortalAppSetup, messageBusPortalAppUnderTest: MessageBusPortalAppUnderTest): Promise<void> => {
    try {
        const {sharedResources, resources, resourcesBasePath, clientBootstrapName, lastReloadTs} = setup;

        // Load shared JS resources first if they exist
        if (sharedResources?.js?.length) {
            await Promise.all(sharedResources.js.map(js =>
                loadJs(`${resourcesBasePath}/${js}?v=${lastReloadTs}`))
            );
        }

        // Load app JS resources
        await Promise.all(resources.js.map(js => loadJs(`${resourcesBasePath}/${js}?v=${lastReloadTs}`)));

        // Load CSS resources
        sharedResources?.css?.forEach(css => loadStyle(`${resourcesBasePath}/${css}?v=${lastReloadTs}`));
        resources?.css?.forEach(css => loadStyle(`${resourcesBasePath}/${css}?v=${lastReloadTs}`));

        const bootstrapFn = (global as any)[clientBootstrapName];
        if (typeof bootstrapFn !== 'function') {
            throw new Error(`Invalid bootstrap function: ${clientBootstrapName}`);
        }

        const wrapperElem = document.getElementById(hostElementId);
        const hostElem = document.createElement('div');
        if (wrapperElem) {
            wrapperElem.innerHTML = '';
            wrapperElem.appendChild(hostElem);
        }

        const modifiedClientServices = {
            ...getClientServices(),
            messageBus: messageBusPortalAppUnderTest
        };

        const result = bootstrapFn(hostElem, setup, modifiedClientServices);
        if (result) {
            loadedAppHooks = typeof result.then === 'function' ? await result : result;
        }

    } catch (error) {
        console.error('Error loading app into sandbox:', error);
        const wrapperElem = document.getElementById(hostElementId);
        if (wrapperElem) {
            wrapperElem.innerHTML = `<div class="mashroom-portal-app-loading-error">Loading ${appName} failed: ${error}</div>`;
        }
        throw error;
    }
};
