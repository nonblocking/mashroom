
import '../sass/styleEditor.scss';

import React from 'react';
import {createRoot} from 'react-dom/client';
import Editor from './Editor';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup) => {
    const {appConfig: {editorTarget}} = portalAppSetup;

    if (!editorTarget?.pluginName) {
        throw new Error('This app can only be started as an App Config Editor!');
    }

    const root = createRoot(portalAppHostElement);
    root.render(<Editor editorTarget={editorTarget} />);

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startReactDemoApp2ConfigEditor = bootstrap;
