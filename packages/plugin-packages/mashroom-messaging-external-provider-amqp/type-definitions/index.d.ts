// @flow

import {MashroomMessagingExternalProvider} from '@mashroom/mashroom-messaging/type-definitions';

export interface MashroomMessagingExternalProviderAMQP extends MashroomMessagingExternalProvider {
    subscribeToInternalTopic(): void;
    unsubscribeFromInternalTopic(): void;
}
