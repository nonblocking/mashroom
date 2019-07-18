// @flow

import exphbs from 'express-handlebars';
import path from 'path';
import helpers from './handlebar_helpers';

import type {MashroomPortalThemePluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalThemePluginBootstrapFunction = async () => {
    return {
        engineName: 'handlebars',
        engineFactory: () => {
            const hbs = exphbs.create({
                helpers,
                partialsDir: path.resolve(__dirname, '../views/partials/'),
            });
            return hbs.engine;
        },
    };
};


export default bootstrap;
