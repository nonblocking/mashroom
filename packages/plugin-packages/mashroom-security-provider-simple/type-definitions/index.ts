import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

export type UserStore = Array<UserStoreEntry>;

// Session data
declare module 'express-session' {
    interface SessionData {
        __MASHROOM_SECURITY_SIMPLE_AUTH_USER?: MashroomSecurityUser;
        __MASHROOM_SECURITY_SIMPLE_AUTH_EXPIRES?: number;
    }
}

export type UserStoreEntry = {
    username: string;
    displayName?: string;
    email?: string;
    pictureUrl?: string;
    passwordHash: string;
    extraData?: Record<string, any>;
    roles: Array<string>;
    secrets?: Record<string, any>;
};
