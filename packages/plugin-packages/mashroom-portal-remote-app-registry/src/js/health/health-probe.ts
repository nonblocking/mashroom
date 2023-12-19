
import context from '../context';

import type {MashroomHealthProbeStatus} from '@mashroom/mashroom/type-definitions';

export default {
    async check(): Promise<MashroomHealthProbeStatus> {
        if (!context.oneFullScanDone) {
            return {
                ready: false,
                error: 'First Remote App scan pending',
            };
        }

        return {
            ready: true,
        };
    }
};
