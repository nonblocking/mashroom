// @flow

import '../sass/style.scss';

import template from './template';

import type {MashroomPortalAppPluginBootstrapFunction} from '../../../../type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (element) => {
    element.innerHTML = template();
    return Promise.resolve();
};

global.startWelcomeApp = bootstrap;
