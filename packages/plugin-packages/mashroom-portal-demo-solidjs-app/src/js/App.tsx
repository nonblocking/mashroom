
import { onMount, onCleanup, createSignal } from 'solid-js';
import logo from '../assets/solidjs.svg';
import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    appConfig: {
        message?: string;
        pingButtonLabel?: string;
    };
    messageBus: MashroomPortalMessageBus;
}

export default ({appConfig: {message, pingButtonLabel}, messageBus}: Props) => {
    const [pings, setPings] = createSignal(0);
    const pingReceiver = () => {
        setPings(pings() + 1);
    };
    onMount(() => {
        messageBus.subscribe('ping', pingReceiver);
    });
    onCleanup(() => {
        messageBus.unsubscribe('ping', pingReceiver);
    });
    const sendPing = () => {
        messageBus.publish('ping', {});
    };
    return (
        <div class='mashroom-demo-solidjs-app'>
            <div class='demo-solidjs-app-logo' innerHTML={logo} />
            <div class="demo-solidjs-app-content">
                <h4>SolidJS Demo App</h4>
                <p>{message}</p>
                <div>
                    <button onClick={sendPing}>
                        {pingButtonLabel || 'Send Ping'}
                    </button>
                    <span>Received pings: {pings()}</span>
                </div>
            </div>
        </div>
    );
};
