// @flow

import RemotePortalAppRegistry from './registry/RemotePortalAppRegistry';

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {GlobalRequestHolder, RegisterPortalRemoteAppsBackgroundJob, Context} from '../../type-definitions/internal';

let currentRequest: ?ExpressRequest = null;
let registerBackgroundJob: any = null;
let webUIShowAddRemoteAppForm = true;

export const globalRequestHolder: GlobalRequestHolder = {

    get request() {
        return currentRequest;
    },

    set request(request: ?ExpressRequest) {
        currentRequest = request;
    }

};

const registry = new RemotePortalAppRegistry(globalRequestHolder);

const context: Context = {

    get registry() {
        return registry;
    },

    get backgroundJob(): RegisterPortalRemoteAppsBackgroundJob {
        return registerBackgroundJob;
    },

    set backgroundJob(job: RegisterPortalRemoteAppsBackgroundJob) {
        registerBackgroundJob = job;
    },

    get webUIShowAddRemoteAppForm() {
        return webUIShowAddRemoteAppForm;
    },

    set webUIShowAddRemoteAppForm(show: boolean) {
        webUIShowAddRemoteAppForm = show;
    }

};

export default context;
