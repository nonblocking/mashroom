// @flow

import ldap from 'ldapjs';

import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {LdapEntry} from '../type-definitions';

export default class LdapClientImpl {

    _serverUrl: string;
    _baseDN: string;
    _bindDN: string;
    _bindCredentials: string;
    _tlsOptions: ?{};
    _logger: MashroomLogger;

    constructor(serverUrl: string, baseDN: string, bindDN: string, bindCredentials: string, tlsOptions: ?{}, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.security.provider.ldap');
        this._serverUrl = serverUrl;
        this._baseDN = baseDN;
        this._bindDN = bindDN;
        this._bindCredentials = bindCredentials;
        this._tlsOptions = tlsOptions;
    }

    async search(filter: string) {
        return await this._runWithClient(this._bindDN, this._bindCredentials, (ldapjsClient) => {
            const searchOpts = {
                filter,
                scope: 'sub',
                attributes: ['dn', 'cn', 'uid', 'mail']
            };

            return new Promise((resolve, reject) => {
                const entries = [];
                ldapjsClient.search(this._baseDN, searchOpts, (err, res) => {
                    res.on('searchEntry', entry => {
                        entries.push(entry.object);
                    });
                    res.on('error', error => {
                        this._logger.error('LDAP search error', {
                            error
                        });
                        reject(error);
                    });
                    res.on('end', () => {
                        resolve(entries);
                    });
                });
            });

        });
    }

    async login(ldapEntry: LdapEntry, password: string) {
        return await this._runWithClient(ldapEntry.dn, password, async () => {
        });
    }

    async _runWithClient<T>(user: string, password: string, f: (ldapjsClient: any) => Promise<T>): Promise<T> {
        let client = null;
        try {
            client = ldap.createClient({
                url: `${this._serverUrl}/${this._baseDN}`,
                maxConnections: 10,
                tlsOptions: this._tlsOptions,
            });
        } catch (error) {
            this._logger.error('Creating LDAP client failed!', {error});
            throw new Error('Could not establish LDAP connection');
        }

        try {
            await this._bind(user, password, client);
        } catch (error) {
            this._logger.error('Binding failed', {error});
            await this._unbind(client);
            throw new Error('Binding failed');
        }

        const result: T = await f(client);

        await this._unbind(client);

        return result;
    }

    async _bind(user: string, password: string, ldapjsClient: any) {
        return new Promise((resolve, reject) => {
            ldapjsClient.bind(user, password, (error) => {
                if (error) {
                    this._logger.error(`Binding with user ${user} failed`, {error});
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    async _unbind(ldapjsClient: any) {
        return new Promise((resolve) => {
            ldapjsClient.unbind((error) => {
                if (error) {
                    this._logger.error('Unbinding failed', {error});
                    resolve();
                } else {
                    resolve();
                }
            });
        });
    }

}

