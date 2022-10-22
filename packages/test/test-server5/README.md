
# Test Server 5

A test server that demonstrates a public website with a virtual host mapping and a CDN and such.

It automatically adds all plugins from https://github.com/nonblocking/mashroom-content if it is cloned into
a folder *mashroom-content* on the same level as this repo.

## Start

    docker-compose up
    npm start

The Portal will be available at http://localhost:5050; the reverse proxy with / mapped to the default site at http://localhost:6060.
Assets will be served by Varnish (CDN) at http://localhost:7070.

Predefined users: john/john, admin/admin

## Stop

    <CTRL+C
    docker-compose down

## Linux Hint

The setup leverages the *host.docker.internal* host name which is only available on Mac and Windows.
On Linux you can activate the host since Docker version 20.10 like this: https://github.com/moby/moby/pull/40007
