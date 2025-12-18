import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

// eslint-disable-next-line import/prefer-default-export
export const startApp: MashroomPortalAppPluginBootstrapFunction = (hostElement, portalAppSetup, clientServices) => {
    const root = createRoot(hostElement);
    root.render(<App />);
    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};
