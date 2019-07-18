// @flow

export type UserStore = Array<UserStoreEntry>;

export type UserStoreEntry = {
    username: string,
    displayName?: string,
    passwordHash: string,
    roles: Array<string>
};
