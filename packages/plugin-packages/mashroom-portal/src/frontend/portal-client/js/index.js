// @flow

import MashroomPortalAppServiceImpl from './MashroomPortalAppServiceImpl';
import MashroomPortalAdminServiceImpl from './MashroomPortalAdminServiceImpl';
import MashroomPortalMessageBusImpl from './MashroomPortalMessageBusImpl';
import MashroomPortalStateServiceImpl from './MashroomPortalStateServiceImpl';
import MashroomRestServiceFetchImpl from './MashroomRestServiceFetchImpl';
import MashroomPortalUserServiceImpl from './MashroomPortalUserServiceImpl';
import MashroomPortalSiteServiceImpl from './MashroomPortalSiteServiceImpl';
import MashroomPortalBrowserErrorHandler from './MashroomPortalBrowserErrorHandler';
import MashroomPortalUserInactivityHandler from './MashroomPortalUserInactivityHandler';
import MashroomPortalRemoteLoggerImpl from './MashroomPortalRemoteLoggerImpl';
import ResourceManager from './ResourceManager';

import {WINDOW_VAR_PORTAL_SERVICES} from '../../../backend/constants';

import type {MashroomPortalClientServices} from '../../../../type-definitions';

const restService = new MashroomRestServiceFetchImpl();
const remoteLogger = new MashroomPortalRemoteLoggerImpl(restService);
const resourceManager = new ResourceManager(restService, remoteLogger);
const portalAppService = new MashroomPortalAppServiceImpl(restService, resourceManager, remoteLogger);
const portalAdminService = new MashroomPortalAdminServiceImpl(restService);
const messageBus = new MashroomPortalMessageBusImpl();
const stateService = new MashroomPortalStateServiceImpl();
const portalUserService = new MashroomPortalUserServiceImpl(restService);
const portalSiteService = new MashroomPortalSiteServiceImpl(restService);

const globalMashroomPortalModule: MashroomPortalClientServices = {
    restService,
    portalAppService,
    portalAdminService,
    portalSiteService,
    messageBus,
    stateService,
    portalUserService,
    remoteLogger,
};

global[WINDOW_VAR_PORTAL_SERVICES] = globalMashroomPortalModule;

const errorHandler = new MashroomPortalBrowserErrorHandler(remoteLogger);
errorHandler.install();

const inactivityHandler = new MashroomPortalUserInactivityHandler(portalUserService);
inactivityHandler.start();
