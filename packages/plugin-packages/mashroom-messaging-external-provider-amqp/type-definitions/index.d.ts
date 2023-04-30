
import type {Connection} from 'rhea';
import type {MashroomMessagingExternalProvider} from '@mashroom/mashroom-messaging/type-definitions';

export interface MashroomMessagingExternalProviderAMQP extends MashroomMessagingExternalProvider {
    start(): void;
    shutdown(): void;
    getClient(): Connection | null;
}
