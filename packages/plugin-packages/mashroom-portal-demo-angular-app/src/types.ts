
export interface PortalAppSetup {
    resourcesBasePath: string,
    firstName: string,
    appConfig: any
}

export interface PortalClientServices {
    messageBus: MashroomPortalMessageBus
}

export interface MashroomPortalMessageBus {
    subscribe(topic: string, callback: (any) => void): void;
    unsubscribe(topic: string, callback: (any) => void): void;
    publish(topic: string, data: any): void;
}
