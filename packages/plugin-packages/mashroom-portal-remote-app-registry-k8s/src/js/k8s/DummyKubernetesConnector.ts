
import type {V1NamespaceList, V1ServiceList} from '@kubernetes/client-node';
import type {KubernetesConnector as KubernetesConnectorType} from '../../../type-definitions';

export default class KubernetesConnector implements KubernetesConnectorType {

    async getNamespacesByLabel(labelSelector: string): Promise<V1NamespaceList> {
        if (labelSelector === 'environment=development') {
            return {
                items: [
                    {
                        metadata: {
                            name: 'dev-namespace1',
                            labels: {
                                environment: 'development'
                            },
                        },
                    },
                    {
                        metadata: {
                            name: 'dev-namespace2',
                            labels: {
                                environment: 'development'
                            },
                        },
                    },
                ]
            };
        } else if (labelSelector === 'environment=development2') {
            return {
                items: [
                    {
                        metadata: {
                            name: 'dev-namespace3',
                            labels: {
                                environment: 'dev2'
                            },
                        },
                    },
                ]
            };
        }
        return {
            items: [
                {
                    metadata: {
                        name: 'whata-namespace',
                    },
                },
            ]
        };
    }

    async getNamespaceServices(namespace: string, labelSelector?: string | null | undefined): Promise<V1ServiceList> {
        if (namespace === 'dev-namespace1') {
            throw new Error('Permission denied');
        } else if (namespace === 'dev-namespace2' || labelSelector === 'environment=dev') {
            return {
                items: [
                    {
                        metadata: {
                            name: 'my-remote-app',
                            namespace: 'dev-namespace2',
                        },
                        spec: {
                            clusterIP: '127.0.0.1',
                            ports: [
                                {
                                    port: 6066
                                }
                            ]
                        }
                    },
                ]
            };
        } else if (namespace === 'dev-namespace3') {
            return {
                items: [
                    {
                        metadata: {
                            name: 'my-remote-app',
                            namespace: 'dev-namespace3',
                        },
                        spec: {
                            clusterIP: '127.0.0.1',
                            ports: [
                                {
                                    port: 6066
                                }
                            ]
                        }
                    },
                ]
            };
        }
        return {
            items: [
                {
                    metadata: {
                        name: 'mashroom-demo-remote-portal-app',
                        namespace: 'default',
                    },
                    spec: {
                        clusterIP: '127.0.0.1',
                        ports: [
                            {
                                port: 6088
                            }
                        ]
                    }
                },
                {
                    metadata: {
                        name: 'unreachable-service',
                        namespace: 'default',
                    },
                    spec: {
                        clusterIP: '1.2.3.4',
                        ports: [
                            {
                                port: 8080
                            }
                        ]
                    }
                },
                {
                    metadata: {
                        name: 'headless-service',
                        namespace: 'default',
                    },
                    spec: {
                        ports: [
                            {
                                port: 8080
                            }
                        ]
                    }
                }
            ]
        };
    }

}
