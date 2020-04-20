
import MashroomVHostPathMapperService from './MashroomVHostPathMapperService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async () => {
    const service = new MashroomVHostPathMapperService();

    return {
        service,
    };
};

export default bootstrap;
