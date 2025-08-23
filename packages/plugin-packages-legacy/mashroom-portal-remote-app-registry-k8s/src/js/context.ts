
import type {Context, KubernetesService} from '../../type-definitions';
import type {MashroomPluginScannerCallback} from '@mashroom/mashroom/type-definitions';

let _namespaces: Array<string> = [];
let _serviceLabelSelector: string | null = null;
let _serviceNameFilter = '';
let _services: Array<KubernetesService> = [];
let _errors: Array<string> = [];
let _scannerCallback: MashroomPluginScannerCallback | null = null;
let _lastScan = -1;
let _initialScanDone = false;

const context: Context = {
    get namespaces() {
        return _namespaces;
    },
    set namespaces(namespaces: Array<string>) {
        _namespaces = namespaces;
    },
    get serviceLabelSelector() {
        return _serviceLabelSelector;
    },
    set serviceLabelSelector(serviceLabelSelector: string | null) {
        _serviceLabelSelector = serviceLabelSelector;
    },
    get serviceNameFilter() {
        return _serviceNameFilter;
    },
    set serviceNameFilter(serviceNameFilter: string) {
        _serviceNameFilter = serviceNameFilter;
    },
    get services() {
        return _services;
    },
    set services(services: Array<KubernetesService>) {
        _services = services;
    },
    get errors() {
        return _errors;
    },
    set errors(errors: Array<string>) {
        _errors = errors;
    },
    get scannerCallback() {
        return _scannerCallback;
    },
    set scannerCallback(scannerCallback: MashroomPluginScannerCallback | null) {
        _scannerCallback = scannerCallback;
    },
    get lastScan() {
        return _lastScan;
    },
    set lastScan(lastScan: number) {
        _lastScan = lastScan;
    },
    get initialScanDone() {
        return _initialScanDone;
    },
    set initialScanDone(done: boolean) {
        _initialScanDone = done;
    },
};

export default context;
