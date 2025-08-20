
import type {MashroomPluginScannerCallback} from '@mashroom/mashroom/type-definitions';
import type {Context, KubernetesRunningPod, KubernetesService, KubernetesWatchedNamespace} from './types';

let _namespaceLabelSelector: string | null = null;
let _serviceLabelSelector: string | null = null;
let _serviceNameFilter = '';
let _watchedNamespaces: Array<KubernetesWatchedNamespace> = [];
let _services: Array<KubernetesService> = [];
let _runningPods: Array<KubernetesRunningPod> = [];
let _errors: Array<string> = [];
let _scannerCallback: MashroomPluginScannerCallback | null = null;
let _initialScanDone = false;

const context: Context = {
    get namespaceLabelSelector() {
      return _namespaceLabelSelector;
    },
    set namespaceLabelSelector(namespaceLabelSelector: string | null) {
        _namespaceLabelSelector = namespaceLabelSelector;
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
    get watchedNamespaces() {
        return _watchedNamespaces;
    },
    set watchedNamespaces(watchedNamespaces: Array<KubernetesWatchedNamespace>) {
        _watchedNamespaces = watchedNamespaces;
    },
    get services() {
        return _services;
    },
    set services(services: Array<KubernetesService>) {
        _services = services;
    },
    get runningPods() {
        return _runningPods;
    },
    set runningPods(pods: Array<KubernetesRunningPod>) {
        _runningPods = pods;
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
    get initialScanDone() {
        return _initialScanDone;
    },
    set initialScanDone(done: boolean) {
        _initialScanDone = done;
    },
};

export default context;
