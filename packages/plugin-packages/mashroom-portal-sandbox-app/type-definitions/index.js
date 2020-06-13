// @flow

import type {Store as ReduxStore, Dispatch as ReduxDispatch} from 'redux';
import type {
    MashroomAvailablePortalApp,
    MashroomPortalAppSetup,
    MashroomPortalMasterMessageBus,
} from '@mashroom/mashroom-portal/type-definitions';

export type State = {|
    +availablePortalApps: Array<MashroomAvailablePortalApp>,
    +selectedPortalApp: ?SelectedPortalApp,
    +appLoadingError: boolean,
    +activePortalApp: ?ActivePortalApp,
    +messageBusCom: MessageBusCommunication,
    +host: PortalAppHost,
|}

export type Action = { type: string } & { [any]: any };

export type Dispatch = ReduxDispatch<Action>;

export type Store = ReduxStore<$Subtype<State>, Action>;

export type SelectedPortalApp = {
    +appName: string,
    +setup: MashroomPortalAppSetup,
}

export type ActivePortalApp = {
    +appName: string,
    +setup: MashroomPortalAppSetup,
}

export interface DummyMessageBus extends MashroomPortalMasterMessageBus {
    onMessageSent(callback: (topic: string, data: any) => void): void;
    onTopicsChanged(callback: (topics: Array<string>) => void): void;
    reset(): void;
}

export type MessageBusMessage = {
    +topic: string,
    +data: {}
}

export type MessageBusCommunication = {
    +topicsSubscribedByApp: Array<string>,
    +publishedByApp: Array<MessageBusMessage>,
    +publishedBySandbox: Array<MessageBusMessage>,
}

export type PortalAppHost = {
    +width: string,
}

export type PortalAppParams = {
    appName: string,
    width: ?string,
    lang: ?string,
    permissions: ?{},
    appConfig: ?{}
}

export type PortalAppQueryParams = {
    appName: ?string,
    preselectAppName: ?string;
    width: ?string,
    lang: ?string,
    permissions: ?{},
    appConfig: ?{}
}
