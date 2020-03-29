// @flow

import type {
    ExpressRequest,
    ExpressMiddleware,
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityProvider,
    MashroomSecurityRoles,
    MashroomSecurityUser,
} from './api';

export interface MashroomSecurityMiddleware {
    middleware(): ExpressMiddleware
}

export interface MashroomSecurityProviderRegistry {
    +providers: Array<MashroomSecurityProvider>;
    findProvider(pluginName: string): ?MashroomSecurityProvider;
    register(pluginName: string, provider: MashroomSecurityProvider): void;
    unregister(pluginName: string): void;
}

/*
 * ACL security
 */

export type HttpMethod = '*' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export type MashroomSecurityACLPermissionRuleComplex = {
    roles?: MashroomSecurityRoles,
    ips?: Array<string>,
}

export type MashroomSecurityACLPermissionRules = 'any' | MashroomSecurityRoles | MashroomSecurityACLPermissionRuleComplex;

export type MashroomSecurityACLPermission = {
    +allow?: MashroomSecurityACLPermissionRules,
    +deny?: MashroomSecurityACLPermissionRules,
}

export type MashroomSecurityACLHTTPMethods = {
    +[method: HttpMethod]: MashroomSecurityACLPermission
}

export type MashroomSecurityACLPaths = {
    +[pathPattern: string]: MashroomSecurityACLHTTPMethods
}

export interface MashroomSecurityACLChecker {
   allowed(req: ExpressRequest, userPrincipal: ?MashroomSecurityUser): Promise<boolean>;
}

