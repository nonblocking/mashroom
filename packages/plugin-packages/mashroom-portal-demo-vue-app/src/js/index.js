
import Vue from 'vue';
import App from './App.vue';

const bootstrap = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { resourcesBasePath, appConfig: { message, pingButtonLabel }} = portalAppSetup;
    const { messageBus } = clientServices;

    // Vue seems to replace the host element, so we create a sub node
    portalAppHostElement.innerHTML = '<div />';

    const vm = new Vue({
        el: portalAppHostElement.firstElementChild,
        render: h => h(App, {
            props: {
                resourcesBasePath,
                message,
                pingButtonLabel,
                messageBus
            }
        })
    });

    return {
        willBeRemoved: () => {
            console.info('Destroying Vue app');
            vm.$destroy();
        }
    };
};

global.startVueDemoApp = bootstrap;
