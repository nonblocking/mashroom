
import Vue from 'vue';
import App from './App.vue';

const bootstrap = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { resourcesBasePath, appConfig: { firstName }} = portalAppSetup;
    const { messageBus } = clientServices;

    const vm = new Vue({
        el: portalAppHostElement,
        render: h => h(App, {
            props: {
                resourcesBasePath,
                firstName,
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
