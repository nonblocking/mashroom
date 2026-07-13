
import type {
    MashroomPortalMessageBus,
    MashroomPortalAppSetup,
    MashroomKnownPortalApp,
    MashroomPortalAppLifecycleHooks
} from '@mashroom/mashroom-portal/type-definitions';

export type State = {
    readonly knownPortalApps: Array<MashroomKnownPortalApp>;
    readonly selectedPortalApp: SelectedPortalApp | undefined | null;
    readonly appLoadingError: boolean;
    readonly activePortalApp: ActivePortalApp | undefined | null;
    readonly messageBusCom: MessageBusCommunication;
    readonly host: PortalAppHost;
}

export type SelectedPortalApp = {
    readonly appName: string;
    readonly setup: MashroomPortalAppSetup;
}

export type LoadedPortalApp = {
    readonly instanceId: string;
    readonly lifecycleHooks: MashroomPortalAppLifecycleHooks | null;
};

export type ActivePortalApp = {
    readonly appName: string;
    readonly setup: MashroomPortalAppSetup;
}

export interface MessageBusPortalAppUnderTest extends MashroomPortalMessageBus {
    onMessageSent(callback: (topic: string, data: any) => void): void;
    onTopicsChanged(callback: (topics: Array<string>) => void): void;
}

export type MessageBusMessage = {
    readonly topic: string;
    readonly data: any;
}

export type MessageBusCommunication = {
    readonly topicsSubscribedByApp: Array<string>;
    readonly publishedByApp: Array<MessageBusMessage>;
    readonly publishedBySandbox: Array<MessageBusMessage>;
}

export type PortalAppHost = {
    readonly width: string;
}

export type PortalAppParams = {
    readonly appName: string;
    readonly width: string | undefined | null;
    readonly lang: string | undefined | null;
    readonly permissions: any | undefined | null;
    readonly appConfig: any | undefined | null;
}

export type PortalAppQueryParams = {
    readonly appName: string | undefined | null;
    readonly preselectAppName: string | undefined | null;
    readonly width: string | undefined | null;
    readonly lang: string | undefined | null;
    readonly permissions: any | undefined | null;
    readonly appConfig: any | undefined | null;
    readonly autoTest: boolean;
}
