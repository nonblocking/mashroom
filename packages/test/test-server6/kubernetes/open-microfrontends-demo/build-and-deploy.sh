#!/bin/bash

source ../set-env.sh
REPO_PATH=`mktemp -d -t open-microfrontends-demo`
echo "Cloning repo into: $REPO_PATH"

# Checkout
rm -rf $REPO_PATH && true
git clone --depth=1 https://github.com/Open-Microfrontends/open-microfrontends-examples $REPO_PATH

# Build
export VERSION=`node -p -e "require('$REPO_PATH/host-backend-integration-api-proxy-security/microfrontend/package.json').version"`
echo "Building and deploying version $VERSION"

npm ci --prefix $REPO_PATH/host-backend-integration-api-proxy-security/microfrontend
npm run build --prefix $REPO_PATH/host-backend-integration-api-proxy-security/microfrontend

# Build container and push to registry
cp Dockerfile $REPO_PATH
docker build -t open-microfrontends-demo:$VERSION $REPO_PATH
docker tag open-microfrontends-demo:$VERSION ${LOCAL_REGISTRY_NAME}:${LOCAL_REGISTRY_PORT}/open-microfrontends-demo:$VERSION
docker push ${LOCAL_REGISTRY_NAME}:${LOCAL_REGISTRY_PORT}/open-microfrontends-demo:$VERSION

# Deploy
envsubst < deployment.yaml | kubectl apply -f -
envsubst < service.yaml | kubectl apply -f -
