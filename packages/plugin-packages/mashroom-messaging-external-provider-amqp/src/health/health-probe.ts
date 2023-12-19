
import type {MashroomHealthProbeStatus} from '@mashroom/mashroom/type-definitions';
import type {MashroomMessagingExternalProviderAMQP} from '../../type-definitions';

export default (provider: MashroomMessagingExternalProviderAMQP) => ({
    async check(): Promise<MashroomHealthProbeStatus> {
        const client = provider.getClient();
        if (!client || client.error || !client.is_open()) {
            return {
                ready: false,
                error: 'AMQP broker for messaging not available',
            };
        }

        return {
            ready: true,
        };
    }
});
