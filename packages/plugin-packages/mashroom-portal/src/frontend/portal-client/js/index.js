// @flow

import MashroomPortalAppServiceImpl from './MashroomPortalAppServiceImpl';
import MashroomPortalAdminServiceImpl from './MashroomPortalAdminServiceImpl';
import MashroomPortalMessageBusImpl from './MashroomPortalMessageBusImpl';
import MashroomPortalStateServiceImpl from './MashroomPortalStateServiceImpl';
import MashroomRestServiceFetchImpl from './MashroomRestServiceFetchImpl';
import MashroomPortalUserServiceImpl from './MashroomPortalUserServiceImpl';
import MashroomPortalSiteServiceImpl from './MashroomPortalSiteServiceImpl';
import PageUnloadHandler from './PageUnloadHandler';
import BrowserErrorHandler from './BrowserErrorHandler';
import AuthenticationExpirationChecker from './AuthenticationExpirationChecker';
import MashroomPortalRemoteLoggerImpl from './MashroomPortalRemoteLoggerImpl';
import ResourceManager from './ResourceManager';

import {WINDOW_VAR_PORTAL_SERVICES} from '../../../backend/constants';

import type {MashroomPortalClientServices} from '../../../../type-definitions';

const restService = new MashroomRestServiceFetchImpl();
const remoteLogger = new MashroomPortalRemoteLoggerImpl(restService);
const resourceManager = new ResourceManager(remoteLogger);
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

const errorHandler = new BrowserErrorHandler(remoteLogger);
errorHandler.install();

const authenticationExpirationChecker = new AuthenticationExpirationChecker(portalUserService);
authenticationExpirationChecker.start();

const pageUnloadHandler = new PageUnloadHandler();
pageUnloadHandler.install();
