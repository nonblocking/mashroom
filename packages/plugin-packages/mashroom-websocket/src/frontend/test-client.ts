
let webSocket: WebSocket | null = null;

const setStatus = (status: string) => {
    (global as any).document.getElementById('status').innerHTML = `Status: ${status}`;
};

const addLog = (log: string) => {
    const logPanel = global.document.getElementById('log');
    const logEntry = global.document.createElement('div');
    if (logPanel && logEntry) {
        logEntry.innerHTML = log;
        logPanel.appendChild(logEntry);
    }
};

(global as any).connect = () => {
    if (!webSocket) {
        const socketProtocol = (global.location.protocol === 'https:' ? 'wss:' : 'ws:');
        const host = global.document.location.hostname;
        const port = global.document.location.port ? `:${global.document.location.port}` : '';
        const path = global.document.location.pathname;
        const clientId = global.sessionStorage.getItem('MashroomPortalWebSocketClientId');
        const wsUrl = `${socketProtocol}//${host}${port}${path}${clientId ? `?clientId=${clientId}` : ''}`;
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
            try {
                const dataObj = JSON.parse(String(event.data));
                const { type, payload } = dataObj;
                if (type === 'setClientId') {
                    global.sessionStorage.setItem('MashroomPortalWebSocketClientId', payload);
                }
            } catch (e: any) {
                console.error('Cannot parse event payload:', e.message);
            }
        };
    }
};

(global as any).disconnect = () => {
    if (webSocket) {
        webSocket.close();
    }
};

(global as any).ping = () => {
    if (webSocket) {
        webSocket.send(JSON.stringify({
            greetings: 'Hello Server!'
        }));
    }
};
