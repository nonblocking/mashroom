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

export type MashroomSecurityACLPathRulePermission = {
    +allow?: MashroomSecurityRoles | '*',
    +deny?: MashroomSecurityRoles | '*',
}

export type MashroomSecurityACLPathRule = {
    +[method: HttpMethod]: MashroomSecurityACLPathRulePermission
}

export type MashroomSecurityACL = {
    +[pathPattern: string]: MashroomSecurityACLPathRule
}

export interface MashroomSecurityACLChecker {
   allowed(req: ExpressRequest, userPrincipal: ?MashroomSecurityUser): Promise<boolean>;
}

