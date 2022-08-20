
import {WINDOW_VAR_PORTAL_SERVICES} from '../../../backend/constants';
import MashroomPortalAppServiceImpl from './MashroomPortalAppServiceImpl';
import MashroomPortalAdminServiceImpl from './MashroomPortalAdminServiceImpl';
import MashroomPortalMessageBusImpl from './MashroomPortalMessageBusImpl';
import MashroomPortalStateServiceImpl from './MashroomPortalStateServiceImpl';
import MashroomRestServiceFetchImpl from './MashroomRestServiceFetchImpl';
import MashroomPortalUserServiceImpl from './MashroomPortalUserServiceImpl';
import MashroomPortalSiteServiceImpl from './MashroomPortalSiteServiceImpl';
import MashroomPortalPageServiceImpl from './MashroomPortalPageServiceImpl';
import PageUnloadHandler from './PageUnloadHandler';
import BrowserErrorHandler from './BrowserErrorHandler';
import AuthenticationExpirationChecker from './AuthenticationExpirationChecker';
import MashroomPortalRemoteLoggerImpl from './MashroomPortalRemoteLoggerImpl';
import ResourceManager from './ResourceManager';


import type {MashroomPortalClientServices} from '../../../../type-definitions';

const restService = new MashroomRestServiceFetchImpl();
const remoteLogger = new MashroomPortalRemoteLoggerImpl(restService);
const resourceManager = new ResourceManager(remoteLogger);
const portalAppService = new MashroomPortalAppServiceImpl(restService, resourceManager);
const portalAdminService = new MashroomPortalAdminServiceImpl(restService);
const messageBus = new MashroomPortalMessageBusImpl();
const stateService = new MashroomPortalStateServiceImpl();
const portalUserService = new MashroomPortalUserServiceImpl(restService);
const portalSiteService = new MashroomPortalSiteServiceImpl(restService);
const portalPageService = new MashroomPortalPageServiceImpl(restService);

const globalMashroomPortalModule: MashroomPortalClientServices = {
    portalAppService,
    portalAdminService,
    portalPageService,
    portalSiteService,
    messageBus,
    stateService,
    portalUserService,
    remoteLogger,
};

(global as any)[WINDOW_VAR_PORTAL_SERVICES] = globalMashroomPortalModule;

const errorHandler = new BrowserErrorHandler(remoteLogger);
errorHandler.install();

const authenticationExpirationChecker = new AuthenticationExpirationChecker(portalUserService);
authenticationExpirationChecker.start();

const pageUnloadHandler = new PageUnloadHandler();
pageUnloadHandler.install();
