
import type {MashroomHealthProbeStatus} from '@mashroom/mashroom/type-definitions';
import type {MashroomMessagingExternalProviderMQTT} from '../../type-definitions';

export default (provider: MashroomMessagingExternalProviderMQTT) => ({
    async check(): Promise<MashroomHealthProbeStatus> {
        const client = provider.getClient();
        if (!client || !client.connected) {
            return {
                ready: false,
                error: 'MQTT broker for messaging not available',
            };
        }

        return {
            ready: true,
        };
    }
});
