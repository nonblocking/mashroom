
export type UserStore = Array<UserStoreEntry>;

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
