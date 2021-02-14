<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { MashroomPluginConfig } from '@mashroom/mashroom/type-definitions';
  import logo from './assets/svelte-logo.svg';

  export let messageBus: any;
  export let appConfig: MashroomPluginConfig & { firstName?: string } = {};
  let pings = 0;

  const incrementPing = (): number => pings += 1;

  messageBus.subscribe('ping', incrementPing);

  const sendPing = (): void => messageBus.publish('ping', {});

  onDestroy(() => {
      messageBus.unsubscribe('ping', incrementPing);
  });
</script>

<style>
    .example-svelte-app {
        padding: 10px;
        display: flex;
    }

    .svelte-logo {
        margin-left: 30px;
        margin-right: 20px;
        height: 80px;
        width: 60px;
        align-self: center;
    }

    button {
        margin-right: 10px;
    }
</style>

<div class='example-svelte-app'>
    <div class="svelte-logo">
        {@html logo}
    </div>
    <div class="demo-svelte-app-content">
        <h4>Svelte Demo App</h4>
        <p>Hello {appConfig.firstName}!</p>
        <div>
            <button on:click={sendPing}>Send Ping</button>
            <span>Received pings: {pings}</span>
        </div>
    </div>
</div>
