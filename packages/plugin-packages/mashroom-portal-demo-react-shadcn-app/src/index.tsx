
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const root = createRoot(portalAppHostElement);
    root.render(
        <div id="mashroom-portal-demo-react-shadcn-app">
            <App />
        </div>
    );
    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startReactShadcnDemoApp = bootstrap;
