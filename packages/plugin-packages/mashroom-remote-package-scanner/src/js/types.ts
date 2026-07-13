import type {MashroomPluginScannerCallback} from '@mashroom/mashroom/type-definitions';

export type RemotePluginPackageEndpoint = {
    readonly url: string;
    readonly lastRefreshTimestamp: number;
    readonly initialScan?: boolean;
};

export type Context = {
    showAddRemotePluginPackageForm: boolean;
    scannerCallback: MashroomPluginScannerCallback | null;
    initialScanDone: boolean;
}
