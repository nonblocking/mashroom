<template>
    <div class="mashroom-demo-vue-app">
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

<script>
    let processPing = null;

    export default {
        name: 'app',
        props: ['resourcesBasePath', 'message', 'pingButtonLabel', 'messageBus'],
        data: () => ({
            pings: 0
        }),
        mounted() {
            processPing = () => this.pings ++;
            this.messageBus.subscribe('ping', processPing);
        },
        beforeUnmount() {
            this.messageBus.unsubscribe('ping', processPing);
        },
        methods: {
            onClick() {
                this.messageBus.publish('ping', {});
            }
        },
    };
</script>

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
