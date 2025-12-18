import state from './state.js';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

const html = `
    <div class='mashroom-demo-pure-js-app'>
        <h4>Pure JS Demo App</h4>
        <p>This is an App written with pure JS that uses ES modules</p>
        <div>
            <button>
                Send Ping
            </button>
            <span>Received pings: <span>0</span></span>
        </div>
    </div>
`;

type Props = {
    hostElement: HTMLElement,
    messageBus: MashroomPortalMessageBus,
    message?: string,
    pingButtonLabel?: string,
}

export default ({hostElement, messageBus, message, pingButtonLabel}: Props) => {
    const template = document.createElement('template');
    template.innerHTML = html;

    const appNode = template.content.firstElementChild as HTMLDivElement;
    const messageNode = appNode.children.item(1) as HTMLParagraphElement;
    const buttonNode = appNode.children.item(2)!.firstElementChild as HTMLButtonElement;
    const countNode = appNode.children.item(2)!.lastElementChild!.firstElementChild as HTMLSpanElement;

    if (message) {
        messageNode.innerText = message;
    }
    if (pingButtonLabel) {
        buttonNode.innerText = pingButtonLabel;
    }
    buttonNode.addEventListener('click', () => {
        messageBus.publish('ping', {});
    });
    state.onCountUpdate(() => {
        countNode.innerText = String(state.count);
    });
    messageBus.subscribe('ping', () => {
        state.count ++;
    });

    hostElement.innerHTML = '';
    hostElement.appendChild(appNode);
};
