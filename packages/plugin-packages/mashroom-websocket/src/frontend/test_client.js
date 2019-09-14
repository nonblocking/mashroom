// @flow

let webSocket: ?WebSocket = null;

const setStatus = (status: string) => {
    global.document.getElementById('status').innerHTML = `Status: ${status}`;
};

const addLog = (log: string) => {
    const logPanel = global.document.getElementById('log');
    const logEntry = global.document.createElement('div');
    logEntry.innerHTML = log;
    logPanel.appendChild(logEntry);
};

global.connect = () => {
    if (!webSocket) {
        const socketProtocol = (global.location.protocol === 'https:' ? 'wss:' : 'ws:');
        const host = global.document.location.hostname;
        const port = global.document.location.port ? ':' + global.document.location.port : '';
        const path = global.document.location.pathname;
        const wsUrl = `${socketProtocol}//${host}${port}${path}`;
        console.info('Try to connect to:', wsUrl);
        webSocket = new global.WebSocket(wsUrl);
        webSocket.onopen = () => {
            console.info('Connection established');
            setStatus('Connected');
        };
        webSocket.onerror = (event: Event) => {
            console.error('WebSocket error', event);
        };
        webSocket.onclose = (event: CloseEvent) => {
            console.error('Connection closed', event);
            setStatus('Not connected');
            addLog(`Connection closed: Code: ${event.code}, Reason: ${event.reason}`);
            webSocket = null;
        };
        webSocket.onmessage = (event: MessageEvent) => {
            console.info('Received message', event);
            addLog(`Received message: ${String(event.data)}`);
            setStatus('Connected');
        };
    }
};

global.ping = () => {
    if (webSocket) {
        webSocket.send(JSON.stringify({
            greetings: 'Hello Server!'
        }));
    }
};
