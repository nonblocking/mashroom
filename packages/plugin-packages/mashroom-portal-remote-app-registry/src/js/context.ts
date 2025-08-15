
import type {Context} from '../../type-definitions';
import type {MashroomPluginScannerCallback} from '@mashroom/mashroom/type-definitions';

let _scannerCallback: MashroomPluginScannerCallback | null = null;
let _webUIShowAddRemoteAppForm = true;
let _initialScanDone = false;

const context: Context = {
    get scannerCallback() {
      return _scannerCallback;
    },
    set scannerCallback(scannerCallback: MashroomPluginScannerCallback | null) {
        _scannerCallback = scannerCallback;
    },
    get webUIShowAddRemoteAppForm() {
        return _webUIShowAddRemoteAppForm;
    },
    set webUIShowAddRemoteAppForm(show: boolean) {
        _webUIShowAddRemoteAppForm = show;
    },
    get initialScanDone() {
        return _initialScanDone;
    },
    set initialScanDone(done: boolean) {
        _initialScanDone = done;
    },
};

export default context;
