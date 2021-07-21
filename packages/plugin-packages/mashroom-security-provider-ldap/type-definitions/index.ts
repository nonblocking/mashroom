
export interface LdapClient {
    search(filter: string, extraAttributes?: Array<string>): Promise<Array<LdapEntry>>;
    login(ldapEntry: LdapEntry, password: string): Promise<void>;
    shutdown(): void;
}

export type LdapEntry = {
    dn: string;
    cn: string;
    sn: string | undefined | null;
    givenName: string | undefined | null;
    displayName: string | undefined | null;
    uid: string | undefined | null;
    mail: string;
    [attr: string]: string | string[] | undefined | null;
}

export type GroupToRoleMapping = {
    [groupName: string]: Array<string>;
}

export type UserToRoleMapping = {
    [userName: string]: Array<string>;
}
