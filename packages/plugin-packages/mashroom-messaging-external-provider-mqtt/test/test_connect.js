/* eslint-disable */

var {connect} = require('mqtt');

const client = connect('mqtt://localhost:1883', {
    connectTimeout: 5000,
    reconnectPeriod: 5000,
    rejectUnauthorized: false,
    protocolVersion: 4,
    username: null,
    password: null,
});
console.info('test');

client.on('message', (topic, payload) => {
    let message = null;
    if (Buffer.isBuffer(payload)) {
        message = payload.toString('utf-8');
    } else {
        message = payload;
    }

    message = JSON.parse(message);

    console.info('Received message: ', topic, message);
});
client.on('error', (err) => {
    console.error('Error', err);
});
client.on('reconnect', () => {
    console.info('Try to reconnect');
});
client.on('connect', () => {
    console.info('Connected');
    publish();
});
client.on('close', (err) => {
    console.error('Error', err);
});

console.info('Subscribing to external1/#');
client.subscribe('external1/#', {
    qos: 1
}, (err, granted) => {
    if (err) {
        console.error('Subscription failed');
    }
});

const publish = () => {
    console.info('Publishing to external1/foo');
    const payload = Buffer.from(JSON.stringify({
        'test': 1
    }), 'utf-8');

    client.publish('external1/foo', payload, {
        qos: 1
    }, (err) => {
        if (err) {
            console.error('Publish failed');
        }
    });

    client.publish('mashroom/user/admin/test', payload, {
        qos: 1
    }, (err) => {
        if (err) {
            console.error('Publish failed');
        }
    });

    setTimeout(() => publish(), 4000);
};
