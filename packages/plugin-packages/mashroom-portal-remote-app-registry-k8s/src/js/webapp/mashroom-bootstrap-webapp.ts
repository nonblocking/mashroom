
import webapp from './webapp';

import {MashroomWebAppPluginBootstrapFunction} from "@mashroom/mashroom/type-definitions";

const bootstrap: MashroomWebAppPluginBootstrapFunction = async () => {
    return webapp;
};

export default bootstrap;
