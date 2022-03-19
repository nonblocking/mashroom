import React, { PureComponent } from 'react';

type Props = {
    echoWSPath: string;
};

type State = {
    status: 'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR' | 'RECONNECTING';
    error: string | null;
    receivedMessage: string | null;
    inputMessage: string;
};

const MAX_NUM_RETRIES = 5;

export default class App extends PureComponent<Props, State> {
    client?: WebSocket | null;
    wsUrl: string;
    retries: number;

    fixWsUrl(wsUrl: string): string {
        if (wsUrl.indexOf('://') === -1) {
            const socketProtocol =
                global.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = global.document.location.hostname;
            const port = global.document.location.port
                ? `:${global.document.location.port}`
                : '';
            return `${socketProtocol}//${host}${port}${wsUrl}`;
        }
        return wsUrl;
    }

    connect() {
        this.client = new WebSocket(this.wsUrl);
        this.client.onopen = () => {
            console.info('Connection opened');
            this.setState({
                status: 'OPEN',
            });
            this.retries = 0;
        };
        this.client.onclose = () => {
            this.client = null;
            setTimeout(() => {
                this.connect();
            }, 1000);
            if (this.retries < MAX_NUM_RETRIES) {
                console.error('Connection closed, reconnecting...');
                this.setState({
                    status: 'RECONNECTING',
                });
                this.retries += 1;
            } else {
                console.error('Connection closed for good');
                this.setState({
                    status: 'CLOSED',
                });
            }
        };
        this.client.onerror = (error) => {
            console.error('Error:', error);
            this.setState({
                status: 'ERROR',
                error: error.toString(),
            });
        };
        this.client.onmessage = (message) => {
            console.debug('Received message:', message);
            this.setState({
                receivedMessage: message.data,
            });
        };
    }

    constructor(props: Props) {
        super(props);
        this.state = {
            status: 'CONNECTING',
            error: null,
            receivedMessage: null,
            inputMessage: '',
        };
        this.retries = MAX_NUM_RETRIES;

        this.wsUrl = this.fixWsUrl(props.echoWSPath);

        this.connect();
    }

    onChange(inputMessage: string) {
        this.setState({
            inputMessage,
        });
    }

    onSend() {
        if (!this.client) {
            console.error('Error sending faild. Client undefined.');
            return;
        }
        const { inputMessage } = this.state;
        if (!inputMessage.trim()) {
            return;
        }

        this.client.send(inputMessage);
        this.setState({
            inputMessage: '',
        });
    }

    render() {
        const { status, error, inputMessage, receivedMessage } = this.state;

        return (
            <div className="mashroom-demo-websocket-proxy-app">
                {status === 'CONNECTING' && (
                    <div className="connecting">Connecting...</div>
                )}
                {status === 'RECONNECTING' && (
                    <div className="connecting">Reconnecting...</div>
                )}
                {status === 'ERROR' && (
                    <div className="error">Error: {error}</div>
                )}
                {status === 'CLOSED' && (
                    <div className="error">Error: Connection closed</div>
                )}
                {status === 'OPEN' && (
                    <div className="echo">
                        <div className="info">
                            <span className="info-icon" />
                            This App connects via the Mashroom HTTP Proxy to a
                            WebSocket echo server
                        </div>
                        <div className="input-form">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => this.onChange(e.target.value)}
                            />
                            <button onClick={() => this.onSend()}>Send</button>
                        </div>
                        {receivedMessage && (
                            <div className="received-message">
                                Received:
                                <pre>{receivedMessage}</pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}
