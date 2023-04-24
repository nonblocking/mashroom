
import type {MqttClient} from 'mqtt';
import type {MashroomMessagingExternalProvider} from '@mashroom/mashroom-messaging/type-definitions';

export interface MashroomMessagingExternalProviderMQTT extends MashroomMessagingExternalProvider {
    subscribeToInternalTopic(): void;
    unsubscribeFromInternalTopic(): void;
    getClient(): MqttClient | undefined;
}
