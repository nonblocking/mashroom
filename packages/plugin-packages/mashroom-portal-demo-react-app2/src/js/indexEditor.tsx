
import '../sass/styleEditor.scss';

import React from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import AppConfigEditor from './AppConfigEditor';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appConfig: {editorTarget}} = portalAppSetup;

    if (!editorTarget || !editorTarget.pluginName) {
        throw new Error('This app can only be started as App Config Editor!');
    }

    render(<AppConfigEditor editorTarget={editorTarget} />, portalAppHostElement);

    return {
        willBeRemoved: () => {
            unmountComponentAtNode(portalAppHostElement);
        }
    };
};

(global as any).startReactDemoApp2ConfigEditor = bootstrap;
