
const KubernetesConnector = require('../dist/k8s/KubernetesConnector').default;

// Tests against kubectl config (e.g. a Minikube)

async function testListNamespaces() {
    const connector = new KubernetesConnector(true);

    const namespaces = await connector.getNamespacesByLabel('environment=development,tier=frontend');

    console.info('Found namespaces:');
    namespaces.items.forEach((ns) => {
        console.info('\t', ns.metadata.name);
    });
}

async function testListServices() {
    const connector = new KubernetesConnector(true);

    const services = await connector.getNamespaceServices('mashroom');

    console.info('Found services:');
    services.items.forEach((service) => {
        console.info('\t', service.metadata.name);
    });
}

testListNamespaces();
// testListServices();
