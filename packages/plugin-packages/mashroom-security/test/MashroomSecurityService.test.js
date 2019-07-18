// @flow

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomSecurityService from '../src/services/MashroomSecurityService';

describe('MashroomSecurityService', () => {

    it('returns the user from the provider', () => {
        const req: any = {
        };

        const securityProviderRegistry: any = {
            findProvider() {
                return {
                    getUser() {
                        return {
                            roles: ['Role2']
                        };
                    }
                }
            }
        };

        const securityService = new MashroomSecurityService('testProvider', securityProviderRegistry, '', '', 'login', dummyLoggerFactory);

        const user = securityService.getUser(req);

        expect(user).toBeTruthy();
        if (user) {
            expect(user.roles).toEqual(['Role2', 'Authenticated']);
        }
    });

    it('should check the resource permission', async () => {

        const user: any = {
            roles: ['Role2']
        };

        const securityProviderRegistry: any = {
            findProvider() {
                return {
                    getUser: () => user
                }
            }
        };

        const request: any = {
            pluginContext: {
                services: {
                    storage: {
                        service: {
                            getCollection() {
                                return {
                                    findOne({key}) {
                                        if (key === 'page1') {
                                            return {
                                                type: 'Page',
                                                key: 'page1',
                                                permissions: [{
                                                    permissions: ['View'],
                                                    roles: ['Role1', 'Role2']
                                                }]
                                            };
                                        } else if (key === 'page2') {
                                            return {
                                                type: 'Page',
                                                key: 'page2',
                                                permissions: [{
                                                    permissions: ['View'],
                                                    roles: ['Role3']
                                                }]
                                            };
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        const securityService = new MashroomSecurityService('testProvider', securityProviderRegistry, '', '', 'login', dummyLoggerFactory);

        const permittedPage1 = await securityService.checkResourcePermission(request, 'Page', 'page1', 'View', false);
        const permittedPage2 = await securityService.checkResourcePermission(request, 'Page', 'page2', 'View', false);
        const permittedUndefinedResource = await securityService.checkResourcePermission(request, 'Page', 'foo', 'View', false);

        expect(permittedPage1).toBeTruthy();
        expect(permittedPage2).toBeFalsy();
        expect(permittedUndefinedResource).toBeFalsy();
    });

});
