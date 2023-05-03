
# Test Server 8

A test server which runs in dev mode and requires the following external services:

 * [Redis](https://redis.io) as an external message broker (PubSub)
 * [MongoDB](https://www.mongodb.com) for session storage

## Start

    docker-compose up
    npm start

Open http://localhost:5050 for the Portal and http://localhost:5050/mashroom for the Admin UI

Predefined users: john/john, admin/admin

## Stop

    <CTRL+C
    docker-compose down

## Test External Messaging with Redis

To test the communication with Mashroom you can connect to Redis on localhost:6379
with https://redis.com/redis-enterprise/redis-insight

Send a message from the Portal to an external system:

* In RedisInsight subscribe to messages
* In the Mashroom Portal add the *Demo Remote Messaging App* to a page and send a message to *external1/foo*
* You should see the message in RedisInsight to external1/foo

Send a message from an external system to the Portal:

* In the Mashroom Portal add the *Demo Remote Messaging App*
* In the RedisInsight client send a message to: mashroom/user/<portal-user>/test
  or to mashroom/global-notifications (to all users)
* You should see the message in the *Demo Remote Messaging App*


