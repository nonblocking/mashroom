#!/bin/bash

source ../set-env.sh
SCRIPT=`realpath $0`
REPO_PATH=`dirname $SCRIPT`

# Build
VERSION=`node -p -e "require('$REPO_PATH/package.json').version"`
echo "Building and deploying version $VERSION"

# Build container and push to registry
docker build -t minimal-remote-portal-app:$VERSION $REPO_PATH
docker tag minimal-remote-portal-app:$VERSION ${LOCAL_REGISTRY_NAME}:${LOCAL_REGISTRY_PORT}/minimal-remote-portal-app:$VERSION
docker push ${LOCAL_REGISTRY_NAME}:${LOCAL_REGISTRY_PORT}/minimal-remote-portal-app:$VERSION

# Deploy
envsubst < deployment.yaml | kubectl apply -f -
envsubst < service.yaml | kubectl apply -f -
