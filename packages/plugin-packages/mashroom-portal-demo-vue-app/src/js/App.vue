<script lang="ts">
    import { defineComponent, PropType } from 'vue';
    import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

    let processPing: (() => void) | undefined;

    export default defineComponent({
        name: 'MashroomPortalDemoVueApp',
        props: {
            resourcesBasePath: {
                type: String,
                required: true,
            },
            message: {
                type: String,
                required: true,
            },
            pingButtonLabel: {
                type: String,
                required: true,
            },
            messageBus: {
                type: Object as PropType<MashroomPortalMessageBus>,
            }
        },
        data: () => ({
            pings: 0,
        }),
        mounted() {
            processPing = () => this.pings ++;
            this.messageBus?.subscribe('ping', processPing);
        },
        beforeUnmount() {
            if (processPing) {
                this.messageBus?.unsubscribe('ping', processPing);
            }
        },
        methods: {
            onClick() {
                this.messageBus?.publish('ping', {});
            }
        },
    });
</script>

<template>
    <div class="mashroom-demo-vue-app">
        <!--
            instead of prefixing the image with resourceBasePath we could just import it and set publicPath: 'auto'
            in the webpack config. But that wouldn't work with SSR.
        -->
        <img :src="resourcesBasePath + '/vue_logo.png'" width="76" height="76" alt="Vue" />
        <div class="demo-vue-app-content">
            <h4>Vue Demo App</h4>
            <p>{{message}}</p>
            <div>
                <button v-on:click="onClick">
                    {{pingButtonLabel || 'Send Ping'}}
                </button>
                <span>Received pings: {{pings}}</span>
            </div>
        </div>
    </div>
</template>

<style>
    .mashroom-demo-vue-app {
        padding: 10px;
        display: flex;
        align-items: center;
    }

    .mashroom-demo-vue-app img {
        height: 76px;
        margin: 0 20px;
    }

    .mashroom-demo-vue-app button {
        margin-right: 10px;
    }
</style>
