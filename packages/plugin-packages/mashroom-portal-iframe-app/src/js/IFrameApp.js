// @flow

type HeightMessage = {
    height: number
}

export default class IFrameApp {

    _url: string;
    _width: string;
    _defaultHeight: string;
    _mounted: boolean;
    _iframe: ?HTMLIFrameElement;
    _boundOnMessage: (event: MessageEvent) => void;

    constructor(url: string, width: string, defaultHeight: string) {
        this._url = url;
        this._width = width;
        this._defaultHeight = defaultHeight;
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
                hostElement.childNodes.forEach((node) => {
                    // Remove other child nodes after loading if any
                    if (node !== this._iframe) {
                        hostElement.removeChild(node);
                    }
                });
                resolve();
            };
            iframe.onerror = (event) => {
                console.error(`Loading failed: ${this._url}`, event);
                reject(event);
            };

            hostElement.appendChild(this._iframe);
            iframe.src = this._url;

            window.addEventListener('message', this._boundOnMessage);
        });
    }

    unmount() {
        if (this._mounted && this._iframe && this._iframe.parentNode) {
            this._iframe.parentNode.removeChild(this._iframe);
            window.removeEventListener('message', this._boundOnMessage);
        }
        this._mounted = false;
    }

    onMessage(event: MessageEvent) {
        if (this._iframe && event.source === this._iframe.contentWindow) {
            console.info('Received message from iframe: ', event.data);

            const heightMessage: HeightMessage = (event.data: any);
            if (this._iframe && typeof(heightMessage.height) === 'number') {
                 this._iframe.style.height = `${heightMessage.height}px`;
                 this._iframe.style.overflowY = 'hidden';
                 this._iframe.scrolling = 'no';
            }
        }
    }
}
