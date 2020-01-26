/* eslint-disable */

const client = require('rhea');

// RabbitMQ
const TOPIC_EXCHANGE_PREFIX = '/topic/';
const MATCH_ANY_WILDCARD = '#';

// ActiveMQ
//const TOPIC_EXCHANGE_PREFIX = 'topic://';
//const MATCH_ANY_WILDCARD = '>';

// Qpid
//const TOPIC_EXCHANGE_PREFIX = 'amq.topic/';
//const MATCH_ANY_WILDCARD = '#';

const connection = client.connect({
    port: '5672',
    host: 'localhost',
    username: 'admin',
    password: 'admin',
    container_id: 'mashroom',
    reconnect: true,
    reconnect_limit: null,
    max_reconnect_delay: null,
});

connection.on('error', (error) => {
   console.error(error);
});

connection.on('disconnected', (error) => {
   console.warn('Disconnected', error);
});

const receiver = connection.open_receiver({
    autoaccept: false,
    source: {
        name: 'subscription1',
        address: `${TOPIC_EXCHANGE_PREFIX}external1.${MATCH_ANY_WILDCARD}`,
        durable: 0,
        expiry_policy: 'session-end',
    }
});
receiver.on('message', (context) => {
    // console.info('Received: ', context.message);
    const { message: { body }, delivery } = context;
    let payload;

    if (body) {
        if (!body.typecode) {
            // Plain
            if (typeof (body) === 'string') {
                try {
                    payload = JSON.parse(body);
                } catch (error) {
                    // Ignore
                }
            } else if (typeof (body) === 'object') {
                payload = body;
            }
        } else if (body.typecode === 0x75 && !body.multiple) {
            // Single Buffer (binary)
            try {
                payload = JSON.parse(body.content.toString());
            } catch (error) {
                // Ignore
            }
        }
    }

    if (payload) {
        console.info(`Received message with routing key '${context.message.subject}': `, payload);
        delivery.accept();
    } else {
        console.error('Ignoring unsupported message type: ', context.message);
    }

    // connection.close();
});

setTimeout(() => {
    const routingKey = 'external1.foo.bar';
    const sender = connection.open_sender({
        name: 'publisher1',
        target: {
            address: `${TOPIC_EXCHANGE_PREFIX}${routingKey}`
        }
    });
    sender.on('sendable', (context) => {
        console.info('Sending message');
        sender.send({
            subject: routingKey,
            body: JSON.stringify({
                'test': 1
            })
        });
        sender.close();
    });
}, 1000);
