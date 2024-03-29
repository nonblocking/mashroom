
import {WEBSOCKET_CONNECT_PATH} from './constants';

import type {Request} from 'express';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomWebSocketService} from '@mashroom/mashroom-websocket/type-definitions';
import type {
    MashroomMessagingService as MashroomMessagingServiceType,
    MashroomMessagingSubscriberCallback,
} from '../../type-definitions';
import type {
    MashroomMessagingInternalService,
} from '../../type-definitions/internal';

const privatePropsMap: WeakMap<MashroomMessagingService, {
    internalService: MashroomMessagingInternalService
}> = new WeakMap();

export default class MashroomMessagingService implements MashroomMessagingServiceType {

    constructor(internalService: MashroomMessagingInternalService, private _enableWebSockets: boolean) {
        privatePropsMap.set(this, {
            internalService,
        });
    }

    async subscribe(req: Request, topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void> {
        const user = this._getUser(req);
        if (!user) {
            throw new Error('Messaging can only be used by authenticated users!');
        }
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return privateProps.internalService.subscribe(user, topic, callback);
        }
    }

    async unsubscribe(topic: string, callback: MashroomMessagingSubscriberCallback): Promise<void> {
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return privateProps.internalService.unsubscribe(topic, callback);
        }
    }

    async publish(req: Request, topic: string, data: any): Promise<void> {
        const user = this._getUser(req);
        if (!user) {
            throw new Error('Messaging can only be used by authenticated users!');
        }
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return privateProps.internalService.publish(user, topic, data);
        }
    }

    getUserPrivateTopic(req: Request): string {
        const user = this._getUser(req);
        if (!user) {
            throw new Error('Messaging can only be used by authenticated users!');
        }
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return privateProps.internalService.getUserPrivateTopic(user);
        }
        return '';
    }

    getWebSocketConnectPath(req: Request): string | null | undefined {
        if (!this._enableWebSockets) {
            return null;
        }

        const webSocketService: MashroomWebSocketService = req.pluginContext.services.websocket!.service;
        if (!webSocketService) {
            return null;
        }

        return `${webSocketService.basePath}${WEBSOCKET_CONNECT_PATH}`;
    }

    private _getUser(req: Request): MashroomSecurityUser | undefined | null {
        const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
        return securityService.getUser(req);
    }

}

