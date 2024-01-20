
import RemotePortalAppRegistry from './registry/RemotePortalAppRegistry';

import type {Request} from 'express';
import type {GlobalRequestHolder, RegisterPortalRemoteAppsBackgroundJob, Context} from '../../type-definitions/internal';

let _currentRequest: Request | undefined | null = null;
let _registerBackgroundJob: RegisterPortalRemoteAppsBackgroundJob | null = null;
let _webUIShowAddRemoteAppForm = true;
let _oneFullScanDone = false;

export const globalRequestHolder: GlobalRequestHolder = {

    get request() {
        return _currentRequest;
    },

    set request(request: Request | undefined | null) {
        _currentRequest = request;
    }

};

const registry = new RemotePortalAppRegistry(globalRequestHolder);

const context: Context = {
    get registry() {
        return registry;
    },
    get backgroundJob(): RegisterPortalRemoteAppsBackgroundJob | null {
        return _registerBackgroundJob;
    },
    set backgroundJob(job: RegisterPortalRemoteAppsBackgroundJob) {
        _registerBackgroundJob = job;
    },
    get webUIShowAddRemoteAppForm() {
        return _webUIShowAddRemoteAppForm;
    },
    set webUIShowAddRemoteAppForm(show: boolean) {
        _webUIShowAddRemoteAppForm = show;
    },
    get oneFullScanDone() {
        return _oneFullScanDone;
    },
    set oneFullScanDone(done: boolean) {
        _oneFullScanDone = done;
    }
};

export default context;
