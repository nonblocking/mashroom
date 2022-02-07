
import logo from '../assets/logo-primary-shades.svg';
import template from './template';

import type {MashroomPortalAppPluginBootstrapFunction} from '../../../../type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (element) => {
    if (!element.querySelector('.welcome-app-content')) {
        element.innerHTML = template(logo);
    }
    return Promise.resolve();
};

(global as any).startWelcomeApp = bootstrap;
