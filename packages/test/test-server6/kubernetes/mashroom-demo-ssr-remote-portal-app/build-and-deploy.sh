#!/bin/bash

source ../set-env.sh
REPO_PATH=`mktemp -d -t mashroom-demo-ssr-remote-portal-app`
echo "Cloning repo into: $REPO_PATH"

# Checkout
rm -rf $REPO_PATH && true
git clone --depth=1 https://github.com/nonblocking/mashroom-demo-ssr-remote-portal-app.git $REPO_PATH

# Build
export VERSION=`node -p -e "require('$REPO_PATH/package.json').version"`
echo "Building and deploying version $VERSION"

npm ci --prefix $REPO_PATH
npm run build --prefix $REPO_PATH

# Build container and push to registry
docker build -t mashroom-demo-ssr-remote-portal-app:$VERSION $REPO_PATH
docker tag mashroom-demo-ssr-remote-portal-app:$VERSION ${LOCAL_REGISTRY_NAME}:${LOCAL_REGISTRY_PORT}/mashroom-demo-ssr-remote-portal-app:$VERSION
docker push ${LOCAL_REGISTRY_NAME}:${LOCAL_REGISTRY_PORT}/mashroom-demo-ssr-remote-portal-app:$VERSION

# Deploy
envsubst < deployment.yaml | kubectl apply -f -
envsubst < service.yaml | kubectl apply -f -
