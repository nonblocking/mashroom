import type {V1Namespace, V1Pod, V1Service} from '@kubernetes/client-node';
import type {KubernetesConnector as KubernetesConnectorType, KubernetesWatchCallback} from '../types';

export default class KubernetesConnector implements KubernetesConnectorType {

    async watchNamespaces(labelSelector: string, cb: KubernetesWatchCallback<V1Namespace>): Promise<AbortController> {
        if (labelSelector === 'environment=development') {
            cb('ADDED', {
                metadata: {
                    name: 'dev-namespace1',
                    labels: {
                        environment: 'development'
                    },
                },
            });
            cb('ADDED', {
                metadata: {
                    name: 'dev-namespace2',
                    labels: {
                        environment: 'development'
                    },
                },
            });

        } else if (labelSelector === 'environment=development2') {
            cb('ADDED', {
                metadata: {
                    name: 'dev-namespace3',
                    labels: {
                        environment: 'dev2'
                    },
                },
            });
        }

        cb('ADDED', {
            metadata: {
                name: 'whata-namespace',
            },
        });

        return new AbortController();
    }

    async watchServices(namespace: string, labelSelector: string | undefined, cb: KubernetesWatchCallback<V1Service>): Promise<AbortController> {
        if (namespace === 'dev-namespace1') {
            throw new Error('Permission denied');
        } else if (namespace === 'dev-namespace2' || labelSelector === 'environment=dev') {
            cb('ADDED', {
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
            });

        } else if (namespace === 'dev-namespace3') {
            cb('ADDED', {
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
            });
        }

        cb('ADDED', {
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
        });
        cb('ADDED', {
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
        });
        cb('ADDED', {
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
        });

        return new AbortController();
    }

    async watchPods(namespace: string, cb: KubernetesWatchCallback<V1Pod>): Promise<AbortController> {

        return new AbortController();
    }

}
