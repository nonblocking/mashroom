// @flow

export type UserStore = Array<UserStoreEntry>;

export type UserStoreEntry = {
    username: string,
    displayName?: string,
    email?: string,
    pictureUrl?: string,
    passwordHash: string,
    roles: Array<string>
};
