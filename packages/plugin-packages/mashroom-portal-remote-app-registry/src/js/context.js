// @flow

import RemotePortalAppRegistry from './registry/RemotePortalAppRegistry';

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {GlobalRequestHolder, RegisterPortalRemoteAppsBackgroundJob} from '../../type-definitions/internal';

let currentRequest: ?ExpressRequest = null;
let registerBackgroundJob: any = null;

export const globalRequestHolder: GlobalRequestHolder = {

    get request() {
        return currentRequest;
    },

    set request(request: ?ExpressRequest) {
        currentRequest = request;
    }

};

export const registry = new RemotePortalAppRegistry(globalRequestHolder);

export const registerBackgroundJobHolder = {

    get backgroundJob(): RegisterPortalRemoteAppsBackgroundJob {
        return registerBackgroundJob;
    },

    set backgroundJob(job: RegisterPortalRemoteAppsBackgroundJob) {
        registerBackgroundJob = job;
    }

};
