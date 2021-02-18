
import type {Request, RequestHandler} from 'express';
import type {
    MashroomSecurityProvider,
    MashroomSecurityRoles,
    MashroomSecurityUser,
} from './api';

export interface MashroomSecurityMiddleware {
    middleware(): RequestHandler;
}

export interface MashroomSecurityProviderRegistry {
    readonly providers: Readonly<Array<MashroomSecurityProvider>> ;
    findProvider(pluginName: string): MashroomSecurityProvider | undefined | null;
    register(pluginName: string, provider: MashroomSecurityProvider): void;
    unregister(pluginName: string): void;
}

/*
 * ACL security
 */

export type HttpMethod = '*' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export type MashroomSecurityACLPermissionRuleComplex = {
    roles?: MashroomSecurityRoles;
    ips?: Array<string>;
}

export type MashroomSecurityACLPermissionRules = 'any' | MashroomSecurityRoles | MashroomSecurityACLPermissionRuleComplex;

export type MashroomSecurityACLPermission = {
    readonly allow?: MashroomSecurityACLPermissionRules;
    readonly deny?: MashroomSecurityACLPermissionRules;
}

export type MashroomSecurityACLHTTPMethods = {
    readonly [method in HttpMethod]: MashroomSecurityACLPermission;
}

export type MashroomSecurityACLPaths = {
    readonly [pathPattern: string]: MashroomSecurityACLHTTPMethods;
}

export interface MashroomSecurityACLChecker {
   allowed(req: Request, userPrincipal: MashroomSecurityUser | undefined | null): Promise<boolean>;
}

