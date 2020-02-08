import {V1ServiceList} from '@kubernetes/client-node';
import {KubernetesConnector as KubernetesConnectorType} from '../../../type-definitions';

export default class KubernetesConnector implements KubernetesConnectorType {

    init(): void {
        // Nothing to do
    }

    async listNamespaceServices(namespace: string): Promise<V1ServiceList> {
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
        }
    }

}
