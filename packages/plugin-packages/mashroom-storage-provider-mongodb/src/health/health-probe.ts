
import {isConnected} from '../mongodb';

import type {MashroomHealthProbeStatus} from '@mashroom/mashroom/type-definitions';

export default {
    async check(): Promise<MashroomHealthProbeStatus> {
        if (!isConnected()) {
            return {
                ready: false,
                error: 'MongoDB for storage not available',
            };
        }

        return {
            ready: true,
        };
    }
};
