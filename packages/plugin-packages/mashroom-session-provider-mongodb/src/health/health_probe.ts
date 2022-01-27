
import {isConnected} from '../mongodb';

import type {MashroomHealthProbeStatus} from '@mashroom/mashroom/type-definitions';

export default {
    async check(): Promise<MashroomHealthProbeStatus> {
        if (!isConnected()) {
            return {
                ready: false,
                error: 'MongoDB for session not available',
            };
        }

        return {
            ready: true,
        };
    }
};
