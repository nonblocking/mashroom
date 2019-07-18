<template>
    <div class="mashroom-demo-vue-app">
        <img :src="resourcesBasePath + '/assets/vue_logo.png'"/>
        <div class="demo-vue-app-content">
            <h4>Vue Demo App</h4>
            <p>Hello {{firstName}}!</p>
            <div>
                <button v-on:click="onClick">Send Ping</button>
                <span>Received pings: {{pings}}</span>
            </div>
        </div>
    </div>
</template>

<script>
    let processPing = null;

    export default {
        name: 'app',
        props: ['resourcesBasePath', 'firstName', 'messageBus'],
        data: () => ({
            pings: 0
        }),
        mounted: function() {
            processPing = () => this.pings ++;
            this.messageBus.subscribe('ping', processPing);
        },
        beforeDestroy: function() {
            this.messageBus.unsubscribe('ping', processPing);
        },
        methods: {
            onClick() {
                this.messageBus.publish('ping', {});
            }
        },
        components: {
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
