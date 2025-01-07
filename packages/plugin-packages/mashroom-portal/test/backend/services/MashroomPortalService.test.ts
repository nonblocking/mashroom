
import MashroomPortalService from '../../../src/backend/services/MashroomPortalService';

describe('MashroomPortalService', () => {

    it('removes unreferenced pages after a site has been deleted', async () => {
        const deleteOneMock = jest.fn();
        const updateResourcePermissionMock = jest.fn();
        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                storage: {
                    service: {
                        getCollection(name: string) {
                            if (name === 'mashroom-portal-sites') {
                                return {
                                    find() {
                                        return {
                                            result: [
                                                {
                                                    siteId: '1',
                                                    pages: [
                                                        {
                                                            pageId: 'page1',
                                                            subPages: [
                                                                {
                                                                    pageId: 'page11',
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            pageId: 'page2',
                                                        }
                                                    ]
                                                },
                                                {
                                                    siteId: '2',
                                                    pages: [
                                                        {
                                                            pageId: 'page5',
                                                        },
                                                    ]
                                                }
                                            ]
                                        };
                                    },
                                    deleteOne: deleteOneMock,
                                };
                            } else  if (name === 'mashroom-portal-pages') {
                                return {
                                    find() {
                                        return {
                                            result: [
                                                {
                                                    pageId: 'page0'
                                                },
                                                {
                                                    pageId: 'page1'
                                                },
                                                {
                                                    pageId: 'page11'
                                                },
                                                {
                                                    pageId: 'page2'
                                                },
                                                {
                                                    pageId: 'page3'
                                                },
                                                {
                                                    pageId: 'page4'
                                                },
                                                {
                                                    pageId: 'page5'
                                                },
                                                {
                                                    pageId: 'page6'
                                                }
                                            ]
                                        };
                                    },
                                    findOne({ pageId }: { pageId: string }) {
                                        return {
                                            pageId,
                                        };
                                    },
                                    deleteOne: deleteOneMock,
                                };
                            }
                        }
                    }
                },
                security: {
                    service: {
                        updateResourcePermission: updateResourcePermissionMock,
                    }
                }
            }
        };

        const portalService = new MashroomPortalService({} as any, { getPluginContext: () => pluginContext });

        await portalService.deleteSite({} as any, '3');

        expect(deleteOneMock.mock.calls.length).toBe(5);
        expect(deleteOneMock.mock.calls).toEqual([
            [
                {
                    siteId: '3'
                }
            ],
            [
                {
                    pageId: 'page0'
                }
            ],
            [
                {
                    pageId: 'page3'
                }
            ],
            [
                {
                    pageId: 'page4'
                }
            ],
            [
                {
                    pageId: 'page6'
                }
            ]
        ]);

        expect(updateResourcePermissionMock.mock.calls.length).toBe(5);
        expect(updateResourcePermissionMock.mock.calls).toEqual([
            [
                {},
                {
                    key: '3',
                    permissions: null,
                    type: 'Site'
                }
            ],
            [
                {},
                {
                    key: 'page0',
                    permissions: null,
                    type: 'Page'
                }
            ],
            [
                {},
                {
                    key: 'page3',
                    permissions: null,
                    type: 'Page'
                }
            ],
            [
                {},
                {
                    key: 'page4',
                    permissions: null,
                    type: 'Page'
                }
            ],
            [
                {},
                {
                    key: 'page6',
                    permissions: null,
                    type: 'Page'
                }
            ]
        ]);
    });

    it('removes all app instances on a deleted page', async () => {
        const deleteOneMock = jest.fn();
        const updateResourcePermissionMock = jest.fn();
        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                storage: {
                    service: {
                        getCollection() {
                            return {
                                findOne() {
                                    return {
                                        pageId: '123',
                                        portalApps: {
                                            area1: [
                                                { pluginName: 'App 1', instanceId: '1' },
                                                { pluginName: 'App 2', instanceId: '2' },
                                            ],
                                            area2: [
                                                { pluginName: 'App 3', instanceId: '3' },
                                            ]
                                        }
                                    };
                                },
                                deleteOne: deleteOneMock,
                            };
                        }
                    }
                },
                security: {
                    service: {
                        updateResourcePermission: updateResourcePermissionMock,
                    }
                }
            }
        };

        const portalService = new MashroomPortalService({} as any, { getPluginContext: () => pluginContext });

        await portalService.deletePage({} as any, '123');

        expect(deleteOneMock.mock.calls.length).toBe(4);
        expect(deleteOneMock.mock.calls).toEqual([
            [
                {
                    pageId: '123'
                }
            ],
            [
                {
                    instanceId: '1',
                    pluginName: 'App 1'
                }
            ],
            [
                {
                    instanceId: '2',
                    pluginName: 'App 2'
                }
            ],
            [
                {
                    instanceId: '3',
                    pluginName: 'App 3'
                }
            ]
        ]);

        expect(updateResourcePermissionMock.mock.calls.length).toBe(4);
        expect(updateResourcePermissionMock.mock.calls).toEqual([
            [
                {},
                {
                    key: '123',
                    permissions: null,
                    type: 'Page'
                }
            ],
            [
                {},
                {
                    key: 'App 1_1',
                    permissions: null,
                    type: 'Portal-App'
                }
            ],
            [
                {},
                {
                    key: 'App 2_2',
                    permissions: null,
                    type: 'Portal-App'
                }
            ],
            [
                {},
                {
                    key: 'App 3_3',
                    permissions: null,
                    type: 'Portal-App'
                }
            ]
        ]);
    });

});
