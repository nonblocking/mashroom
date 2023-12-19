
import {isConnected} from '../redis-client';

import type {MashroomHealthProbeStatus} from '@mashroom/mashroom/type-definitions';

export default {
    async check(): Promise<MashroomHealthProbeStatus> {
        if (!isConnected()) {
            return {
                ready: false,
                error: 'Redis for memory cache not available',
            };
        }

        return {
            ready: true,
        };
    }
};
