
const KubernetesConnector = require('../dist/k8s/KubernetesConnector').default;

// Tests against kubectl config (e.g. a Minikube)

async function testWatchNamespaces() {
    const connector = new KubernetesConnector(true, () => console);

    const abortController = await connector.watchNamespaces('env=development,microfrontends=true', (event, obj) => {
        console.info('Namespace event:', event, obj.metadata.name);
    });

    console.info('Watching...');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    abortController.abort();
}

async function testWatchServices() {
    const connector = new KubernetesConnector(true, () => console);

    const abortController = await connector.watchServices('test1', 'microfrontends=true', (event, obj) => {
        console.info('Service event:', event, obj.metadata.uid, obj.metadata.name);
    });

    console.info('Watching...');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    abortController.abort();
}

async function testWatchPods() {
    const connector = new KubernetesConnector(true, () => console);

    const abortController = await connector.watchPods('test1', (event, obj) => {
        console.info('Pod event:', event, obj.metadata.uid, obj.metadata.name, obj.status.phase, obj.spec.containers[0].image);
    });

    console.info('Watching...');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    abortController.abort();
}

testWatchNamespaces();
testWatchServices();
testWatchPods();
