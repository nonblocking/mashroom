
type HeightMessage = {
    height: number;
}

export default class IFrameApp {

    private mounted: boolean;
    private iframe: HTMLIFrameElement | null;
    private boundOnMessage: (event: MessageEvent) => void;

    constructor(private url: string, private width: string, private defaultHeight: string) {
        this.mounted = false;
        this.iframe = null;
        this.boundOnMessage = this.onMessage.bind(this);
    }

    mount(hostElement: HTMLElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            this.iframe = iframe;

            iframe.style.border = 'none';
            iframe.style.width = this.width;
            iframe.style.height = '0';

            iframe.onload = () => {
                iframe.style.height = this.defaultHeight;
                hostElement.childNodes.forEach((node) => {
                    // Remove other child nodes after loading if any
                    if (node !== this.iframe) {
                        hostElement.removeChild(node);
                    }
                });
                resolve();
            };
            iframe.onerror = (event) => {
                console.error(`Loading failed: ${this.url}`, event);
                reject(event);
            };

            hostElement.appendChild(this.iframe);
            iframe.src = this.url;

            window.addEventListener('message', this.boundOnMessage);
        });
    }

    unmount() {
        if (this.mounted && this.iframe && this.iframe.parentNode) {
            this.iframe.parentNode.removeChild(this.iframe);
            window.removeEventListener('message', this.boundOnMessage);
        }
        this.mounted = false;
    }

    onMessage(event: MessageEvent) {
        if (this.iframe && event.source === this.iframe.contentWindow) {
            console.info('Received message from iframe: ', event.data);

            const heightMessage: HeightMessage = event.data;
            if (this.iframe && typeof(heightMessage.height) === 'number') {
                 this.iframe.style.height = `${heightMessage.height}px`;
                 this.iframe.style.overflowY = 'hidden';
                 this.iframe.scrolling = 'no';
            }
        }
    }
}
