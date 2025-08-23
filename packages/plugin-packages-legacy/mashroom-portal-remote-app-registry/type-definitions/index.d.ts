import type {MashroomPluginScannerCallback} from '@mashroom/mashroom/type-definitions';

export type RemotePortalAppEndpoint = {
    readonly url: string;
    readonly lastRefreshTimestamp: number;
    readonly initialScan?: boolean;
};

export type Context = {
    webUIShowAddRemoteAppForm: boolean;
    scannerCallback: MashroomPluginScannerCallback | null;
    initialScanDone: boolean;
}
