import App from './App.js';
import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const startPureJsDemoApp: MashroomPortalAppPluginBootstrapFunction = (hostElement, portalAppSetup, clientServices) => {
    const {appConfig: {message, pingButtonLabel}} = portalAppSetup;
    const {messageBus} = clientServices;
    App({hostElement, messageBus, message, pingButtonLabel});
};

// NOTE: We can export it here rather than defining a global variable
export default {
    startPureJsDemoApp,
};

// Alternatively:
// export const startPureJsDemoApp = bootstrap;
