<script lang="ts" setup>
    import { onMounted, onUnmounted, ref, defineProps } from 'vue';
    import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

    const props = defineProps<{
        resourcesBasePath: string;
        message: string;
        pingButtonLabel: string;
        messageBus?: MashroomPortalMessageBus;
    }>();

    let pings = ref(0);
    const sendPing = () => props.messageBus?.publish('ping', {});
    const processPing = () => pings.value ++;

    onMounted(() => {
        props.messageBus?.subscribe('ping', processPing);
    });

    onUnmounted(() => {
        props.messageBus?.unsubscribe('ping', processPing);
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
                <button v-on:click="sendPing">
                    {{pingButtonLabel || 'Send Ping'}}
                </button>
                <span>Received pings: {{pings}}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
    .mashroom-demo-vue-app {
        padding: var(--mashroom-portal-spacing-default, 10px);
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
