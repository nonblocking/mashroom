
import MashroomSessionService from './MashroomSessionService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async () => {
    const service = new MashroomSessionService();

    return {
        service,
    };
};

export default bootstrap;
