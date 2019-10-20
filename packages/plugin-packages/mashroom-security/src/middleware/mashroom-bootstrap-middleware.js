// @flow

import MashroomSecurityMiddleware from './MashroomSecurityMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async () => {
    const middleware = new MashroomSecurityMiddleware();
    return middleware.middleware();
};

export default bootstrap;
