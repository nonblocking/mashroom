
import KubernetesServiceRegistry from './registry/KubernetesServiceRegistry';

import type {Context} from '../../type-definitions';

export const _registry = new KubernetesServiceRegistry();
let _serviceNameFilter = '';
let _error: string | null = null;
let _lastScan = 0;
let _oneFullScanDone = false;

const context: Context = {
    get registry() {
        return _registry;
    },
    get error() {
        return _error;
    },
    set error(error: string | null) {
        _error = error;
    },
    get lastScan() {
        return _lastScan;
    },
    set lastScan(lastScan: number) {
        _lastScan = lastScan;
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
