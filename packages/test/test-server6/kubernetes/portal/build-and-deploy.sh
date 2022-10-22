#!/bin/bash

source ../set-env.sh
export VERSION=`node version.js`
echo "Building and deploying version $VERSION"

# Build portal
npm run setup --prefix ../../../../..
npm run build:core --prefix ../../../../..
npm run build:plugins --prefix ../../../../..

# Build container and push to registry
node create-dist.js
docker build -t mashroom-portal:$VERSION .
docker tag mashroom-portal:$VERSION ${LOCAL_REGISTRY_NAME}:${LOCAL_REGISTRY_PORT}/mashroom-portal:$VERSION
docker push ${LOCAL_REGISTRY_NAME}:${LOCAL_REGISTRY_PORT}/mashroom-portal:$VERSION

# Deploy
envsubst < service-account.yaml | kubectl apply -f -
envsubst < session-volume-claim.yaml | kubectl apply -f -
envsubst < deployment.yaml | kubectl apply -f -
envsubst < service.yaml | kubectl apply -f -

