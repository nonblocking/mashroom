import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

// Session data
declare module 'express-session' {
    interface SessionData {
        __MASHROOM_SECURITY_LDAP_AUTH_USER?: MashroomSecurityUser;
        __MASHROOM_SECURITY_LDAP_AUTH_EXPIRES?: number;
    }
}

export interface LdapClient {
    searchUser(filter: string, extraAttributes?: Array<string>): Promise<Array<LdapEntryUser>>;
    searchGroups(query: string): Promise<Array<BaseLdapEntry>>;
    login(ldapEntry: BaseLdapEntry, password: string): Promise<void>;
    shutdown(): void;
}

export type BaseLdapEntry = {
    readonly dn: string;
    readonly cn: string;
}

export type LdapEntryUser = BaseLdapEntry & {
    readonly sn: string | undefined | null;
    readonly givenName: string | undefined | null;
    readonly displayName: string | undefined | null;
    readonly uid: string | undefined | null;
    readonly mail: string;
    [attr: string]: string | string[] | undefined | null;
}

export type GroupToRoleMapping = {
    [groupName: string]: Array<string>;
}

export type UserToRoleMapping = {
    [userName: string]: Array<string>;
}
