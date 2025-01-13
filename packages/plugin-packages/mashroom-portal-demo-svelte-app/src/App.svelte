<script lang="ts">
  import { onDestroy } from 'svelte';
  import logo from './assets/svelte-logo.svg';
  import type {MashroomPortalMessageBus} from "@mashroom/mashroom-portal/type-definitions";

  // Exported props
  export let messageBus: MashroomPortalMessageBus;
  export let appConfig: { message?: string, pingButtonLabel?: string } = {};

  // State
  let pings = 0;

  const incrementPing = () => pings += 1;
  const sendPing = () => messageBus.publish('ping', {});

  messageBus.subscribe('ping', incrementPing);
  onDestroy(() => {
      messageBus.unsubscribe('ping', incrementPing);
  });
</script>

<style>
    .example-svelte-app {
        padding: var(--mashroom-portal-spacing-default, 10px);
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
        <p>{appConfig.message}</p>
        <div>
            <button on:click={sendPing}>
                {appConfig.pingButtonLabel || 'Send Ping'}
            </button>
            <span>Received pings: {pings}</span>
        </div>
    </div>
</div>
