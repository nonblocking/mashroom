
type HeightMessage = {
    height: number;
}

export default class IFrameApp {

    private _mounted: boolean;
    private _iframe: HTMLIFrameElement | null;
    private _boundOnMessage: (event: MessageEvent) => void;

    constructor(private _url: string, private _width: string, private _defaultHeight: string) {
        this._mounted = false;
        this._iframe = null;
        this._boundOnMessage = this.onMessage.bind(this);
    }

    mount(hostElement: HTMLElement): Promise<void> {
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            this._iframe = iframe;

            iframe.style.border = 'none';
            iframe.style.width = this._width;
            iframe.style.height = '0';

            iframe.onload = () => {
                iframe.style.height = this._defaultHeight;
                const childElements = [...hostElement.children];
                childElements.forEach((childEl) => {
                    if (childEl !== this._iframe) {
                        hostElement.removeChild(childEl);
                    }
                });
                resolve();
            };
            iframe.onerror = (event) => {
                console.error(`Loading failed: ${this._url}`, event);
                reject(event);
            };

            iframe.src = this._url;
            hostElement.appendChild(this._iframe);
            this._mounted = true;

            window.addEventListener('message', this._boundOnMessage);
        });
    }

    unmount() {
        if (this._mounted && this._iframe && this._iframe.parentNode) {
            this._iframe.parentNode.removeChild(this._iframe);
            window.removeEventListener('message', this._boundOnMessage);
        }
        this._iframe = null;
        this._mounted = false;
    }

    onMessage(event: MessageEvent) {
        if (this._iframe && event.source === this._iframe.contentWindow) {
            console.info('Received message from iframe:', event.data);

            const heightMessage: HeightMessage = event.data;
            if (this._iframe && typeof(heightMessage?.height) === 'number') {
                 this._iframe.style.height = `${heightMessage.height}px`;
                 this._iframe.style.overflowY = 'hidden';
                 this._iframe.scrolling = 'no';
            }
        }
    }
}
