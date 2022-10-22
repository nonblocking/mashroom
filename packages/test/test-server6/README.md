
# Test Server 6

A test server similar to Test Server 1 but supposed to run in a Kubernetes cluster.

**NOTE**: The server does not run in dev mode, so changes in plugin packages are not automatically applied (locally).

# Start Locally

    npm start

Open http://localhost:5050 and http://localhost:5050/portal for the Portal

Predefined users: john/john, admin/admin

# Deploy to Kubernetes

## Prerequisites

 * kubectl must point to the Cluster
 * The following namespaces must exist portal, test1, test2 and need to be accessible
 * Namespace test1 must have the labels test=true and env=test1
 * Namespace test2 must have the labels test=true and env=test2
 * Set the docker registry you want to use in kubernetes/set-env.sh

Alternatively install [K3D](https://k3d.io) and run

    ce kubernetes/common
    ./setup-k3d-cluster.sh

to setup and configure a new cluster locally.

## Build and deploy the Portal

    cd kubernetes/portal
    ./build-and-deploy.sh

Then you have to create an ingress for the *mashroom-portal* Service in the *portal* Namespace.

If you have used the *setup-k3d-cluster.sh* the Portal will be available at http://localhost:8085

## Deploy a Microfrontend

Any Microfrontend deployed in namespace *test1* or *test2* will automatically be registered if the Service
has additionally the label *microfrontend=true*.

You can deploy the *mashroom-demo-ssr-remote-portal-app* Microfrontend on *test1* with:

    cd kubernetes/mashroom-demo-ssr-remote-portal-app
    ./build-and-deploy.sh
