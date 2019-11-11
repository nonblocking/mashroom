
export interface PortalAppSetup {
    resourcesBasePath: string,
    appConfig: {
        firstName: string,
    }
}

export interface PortalClientServices {
    messageBus: MashroomPortalMessageBus
}

export interface MashroomPortalMessageBus {
    subscribe(topic: string, callback: (any) => void): void;
    unsubscribe(topic: string, callback: (any) => void): void;
    publish(topic: string, data: any): void;
}
