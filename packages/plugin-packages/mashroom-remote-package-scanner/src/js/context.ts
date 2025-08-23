
import type {Context} from './types';
import type {MashroomPluginScannerCallback} from '@mashroom/mashroom/type-definitions';

let _scannerCallback: MashroomPluginScannerCallback | null = null;
let _showAddRemotePluginPackageForm = true;
let _initialScanDone = false;

const context: Context = {
    get scannerCallback() {
      return _scannerCallback;
    },
    set scannerCallback(scannerCallback: MashroomPluginScannerCallback | null) {
        _scannerCallback = scannerCallback;
    },
    get showAddRemotePluginPackageForm() {
        return _showAddRemotePluginPackageForm;
    },
    set showAddRemotePluginPackageForm(show: boolean) {
        _showAddRemotePluginPackageForm = show;
    },
    get initialScanDone() {
        return _initialScanDone;
    },
    set initialScanDone(done: boolean) {
        _initialScanDone = done;
    },
};

export default context;
