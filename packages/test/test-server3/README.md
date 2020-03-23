
# Test Server

A test server that runs in dev mode and uses a bunch of external services:

 * [Redis](https://redis.io) for sessions
 * [MongoDB](https://www.mongodb.com) for storage
 * [Keycloak](https://www.keycloak.org) for security (via OpenID Connect)
 * [Mosquitto](https://mosquitto.org) as external messaging provider (via MQTT)

## Start

    docker-compose up
    npm start

After the first start you have to add some users:

  * Open: http://localhost:8080/auth/admin/
  * Login with admin/test
  * Switch to the *Test* realm and add some Users (don't forget to add Credentials)
  * Add the *mashroom-admin* role to some users

## Stop

    <CTRL+C
    docker-compose down
