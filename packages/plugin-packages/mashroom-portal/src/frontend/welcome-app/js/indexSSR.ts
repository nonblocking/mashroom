
import {resolve} from 'path';
import {readFileSync} from 'fs';
import template from './template';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '../../../../type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async () => {
    const logo = readFileSync(resolve(__dirname, '../assets/logo-primary-shades.svg')).toString('utf-8');
    return template(logo);
};

export default bootstrap;
