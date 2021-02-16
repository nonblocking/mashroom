
import type {Connection} from 'rhea';
import type {MashroomMessagingExternalProvider} from '@mashroom/mashroom-messaging/type-definitions';

export interface MashroomMessagingExternalProviderAMQP extends MashroomMessagingExternalProvider {
    subscribeToInternalTopic(): void;
    unsubscribeFromInternalTopic(): void;
    getClient(): Connection | null;
}
