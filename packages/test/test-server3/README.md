
# Test Server

A test server that runs in dev mode and uses a bunch of external services:

 * [Redis](https://redis.io) for sessions
 * [MongoDB](https://www.mongodb.com) for storage
 * [Keycloak](https://www.keycloak.org) for security (via OpenID Connect)
 * [Mosquitto](https://mosquitto.org) as external messaging provider (via MQTT)

## Start

    docker-compose up
    npm start

Open http://localhost:5050 for the Portal and http://localhost:5050/mashroom for the Admin UI

Predefined users: john/john, admin/admin

## Stop

    <CTRL+C
    docker-compose down

## Administration

### Keycloak

To add some additional users and manage roles:

  * Open: http://localhost:8080/auth/admin/
  * Login with admin/test
  * Switch to the *Test* realm and add manage users and roles
  * Add the *mashroom-admin* role if the users should be Administrator

### Mosquitto

To test the communication with Mashroom you can connect to Mosquitto on localhost:1883 (e.g. with http://mqtt-explorer.com)
or via Websocket on localhost:9001 (e.g. with
a web client like http://www.hivemq.com/demos/websocket-client)

Send a message from the Portal to an external system:

 * In the MQTT client subscribe to: external1/#
 * In the Mashroom Portal add the *Demo Remote Messaging App* to a page and send a message to *external1/foo*
 * You should see the message in the MQTT client

Send a message from an external system to the Portal:

 * In the Mashroom Portal add the *Demo Remote Messaging App*
 * In the MQTT client send a message to: mashroom/user/<portal-user>/test
 * You should see the message in the *Demo Remote Messaging App*
