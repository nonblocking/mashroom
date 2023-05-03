
# Test Server 4

A test server which runs in dev mode and requires a bunch of external services:

 * [OpenLDAP](https://www.openldap.org/) for security (via OpenID Connect)
 * [RabbitMQ](https://www.rabbitmq.com/) as external messaging provider (via AMQP)

## Start

    docker-compose up
    npm start

Open http://localhost:5050 for the Portal and http://localhost:5050/mashroom for the Admin UI

Predefined users: john/john, admin/admin

## Stop

    <CTRL+C
    docker-compose down

## Administration

### OpenLDAP

To add some additional users open the LDAP Admin UI: https://localhost:4433 - login with: cn=admin,dc=nonblocking,dc=at/admin

### Test External Messaging with RabbitMQ

To publish and subscribe messages you can use the RabbitMQ Admin Ui: http://localhost:15672 - login with guest/guest

Send a message from the Portal to an external system:

 * In the Rabbit MQ Admin UI got to *Queues*
 * Create a new Queue with an arbitrary name
 * Click on the new queue and go to *Add binding to this queue*
 * Enter *From Exchange*: *amq.topic* and *Routing key*: *external1.#* and click *Bind*
 * In the Mashroom Portal add the *Demo Remote Messaging App* to a page and send a message to *external1/foo*
 * In the RabbitMQ Admin UI on the page of your queue click *Get Messages*
 * You should see the message

Send a message from an external system to the Portal:

 * In the Mashroom Portal add the *Demo Remote Messaging App*
 * In the RabbitMQ Admin UI go to *Exchange* -> *amq.topic*
 * Go to *Publish message* and enter *mashroom.user.<portal-user>.test* as routing key and payload that is valid JSON
   (or to routing key mashroom.global-notifications)
 * You should see the message in the *Demo Remote Messaging App*
