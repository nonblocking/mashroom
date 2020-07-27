// @flow
import { loadedPortalAppsInternal } from './MashroomPortalAppServiceImpl';

/*
 * On page unload we call all willBeRemoved lifecycle hooks to give the apps the chance
 * to cleanup or persist their state properly
 */
export default class PageUnloadHandler {

    install() {
        window.addEventListener('unload', () => {
            loadedPortalAppsInternal.forEach((loadedApp) => {
               if (loadedApp.lifecycleHooks && loadedApp.lifecycleHooks.willBeRemoved) {
                   try {
                       const promise = loadedApp.lifecycleHooks.willBeRemoved();
                       if (promise && promise.then) {
                           promise.then(
                               () => {
                               },
                               (error) => {
                                   console.warn(`Calling willBeRemoved callback of app '${loadedApp.pluginName}' failed`, error);
                               }
                           );
                       }
                   } catch (error) {
                       console.warn(`Calling willBeRemoved callback of app '${loadedApp.pluginName}' failed`, error);
                   }
               }
            });
        });
    }
}

