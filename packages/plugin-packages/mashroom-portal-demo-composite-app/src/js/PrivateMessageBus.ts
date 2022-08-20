
import type {ActiveApp} from './types';
import type {RefObject} from 'react';
import type {
    MashroomPortalMessageBus,
    MashroomPortalMessageBusInterceptor
} from '@mashroom/mashroom-portal/type-definitions';

export default class PrivateMessageBus {

    interceptor: MashroomPortalMessageBusInterceptor;

    constructor(private messageBus: MashroomPortalMessageBus, private activeAppRef: RefObject<ActiveApp | undefined>, private onPingCb: () => void) {
        this.interceptor =  (data, topic, senderAppId, receiverAppId, cancelMessage) => {
            // If this is a ping from the current active App we call the onPingCb and swallow it
            if (topic === 'ping' && activeAppRef.current?.appId === senderAppId) {
                onPingCb();
                cancelMessage();
            }
        };
        this.messageBus.registerMessageInterceptor(this.interceptor);
    }

    uninstall() {
        this.messageBus.unregisterMessageInterceptor(this.interceptor);
    }

}
