
import React, {PureComponent} from 'react';

type Props = {
    echoWSPath: string;
}

type State = {
    status: 'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR';
    error: string | null;
    receivedMessage: string | null;
    inputMessage: string;
}

export default class App extends PureComponent<Props, State> {

    client: WebSocket;

    constructor(props: Props) {
        super(props);
        this.state = {
            status: 'CONNECTING',
            error: null,
            receivedMessage: null,
            inputMessage: '',
        };

        let wsUrl = props.echoWSPath;
        if (wsUrl.indexOf('://') === -1) {
            const socketProtocol = (global.location.protocol === 'https:' ? 'wss:' : 'ws:');
            const host = global.document.location.hostname;
            const port = global.document.location.port ? `:${global.document.location.port}` : '';
            wsUrl = `${socketProtocol}//${host}${port}${props.echoWSPath}`;
        }

        this.client = new WebSocket(wsUrl);
        this.client.onopen = () => {
            console.info('Connection opened');
            this.setState({
                status: 'OPEN',
            });
        };
        this.client.onclose = () => {
            console.error('Connection closed:');
            this.setState({
                status: 'CLOSED',
            });
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

    onChange(inputMessage: string) {
        this.setState({
            inputMessage,
        })
    }

    onSend() {
        const {inputMessage} = this.state;
        if (!inputMessage.trim()) {
            return;
        }

        this.client.send(inputMessage);
        this.setState({
            inputMessage: '',
        });
    }

    render() {
        const {status, error, inputMessage, receivedMessage} = this.state;

        return (
            <div className='mashroom-demo-websocket-proxy-app'>
                {status === 'CONNECTING' && (
                    <div className='connecting'>
                        Connecting...
                    </div>
                )}
                {status === 'ERROR' && (
                    <div className='error'>
                        Error: {error}
                    </div>
                )}
                {status === 'CLOSED' && (
                    <div className='error'>
                        Error: Connection closed
                    </div>
                )}
                {status === 'OPEN' && (
                    <div className="echo">
                        <div className="info">
                            <span className="info-icon" />
                            This App connects via the Mashroom HTTP Proxy to the WebSocket
                            echo server on websocket.org
                        </div>
                        <div className="input-form">
                            <input type="text" value={inputMessage} onChange={(e) => this.onChange(e.target.value)} />
                            <button onClick={() => this.onSend()}>Send</button>
                        </div>
                        {receivedMessage && (
                            <div className="received-message">
                                Received:
                                <pre>
                                    {receivedMessage}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

}
