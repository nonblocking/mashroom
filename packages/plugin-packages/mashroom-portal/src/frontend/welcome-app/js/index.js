// @flow

import '../sass/style.scss';

import template from './template';

import type {MashroomPortalAppPluginBootstrapFunction} from '../../../../type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (element, portalAppSetup) => {
    element.innerHTML = template(portalAppSetup.resourcesBasePath);
    return Promise.resolve();
};

global.startWelcomeApp = bootstrap;
