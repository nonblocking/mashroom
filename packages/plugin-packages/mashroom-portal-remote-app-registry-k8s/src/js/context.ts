
import KubernetesServiceRegistry from './registry/KubernetesServiceRegistry';

import type {Context} from '../../type-definitions';

export const _registry = new KubernetesServiceRegistry();
let _namespaces: Array<string> = [];
let _serviceLabelSelector: string | null = null;
let _serviceNameFilter = '';
let _errors: Array<string> = [];
let _lastScan = 0;
let _oneFullScanDone = false;

const context: Context = {
    get registry() {
        return _registry;
    },
    get errors() {
        return _errors;
    },
    set errors(errors: Array<string>) {
        _errors = errors;
    },
    get lastScan() {
        return _lastScan;
    },
    set lastScan(lastScan: number) {
        _lastScan = lastScan;
    },
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
    get oneFullScanDone() {
        return _oneFullScanDone;
    },
    set oneFullScanDone(done: boolean) {
        _oneFullScanDone = done;
    },
};

export default context;
