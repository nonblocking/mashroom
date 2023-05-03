
import {isConnected} from '../redis_client';
import type {MashroomHealthProbeStatus} from '@mashroom/mashroom/type-definitions';

export default () => ({
    async check(): Promise<MashroomHealthProbeStatus> {
        if (!isConnected()) {
            return {
                ready: false,
                error: 'Redis broker for messaging not available',
            };
        }

        return {
            ready: true,
        };
    }
});
