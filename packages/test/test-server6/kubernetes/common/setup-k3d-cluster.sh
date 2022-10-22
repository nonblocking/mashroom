
source ../set-env.sh

CLUSTER=mashroom-cluster

# Setup a registry and add it to etc/hosts
k3d registry create mashroomregistry.localhost --port 12345

IP="127.0.0.1"
HOSTNAME="k3d-mashroomregistry.localhost"
HOSTS_LINE="$IP\t$HOSTNAME"
if [ -n "$(grep $HOSTNAME /etc/hosts)" ]
then
    echo "Entry with $HOSTNAME already exists"
else
    echo "Trying to add $HOSTNAME to your /etc/hosts";
    sudo -- sh -c -e "echo '$HOSTS_LINE' >> /etc/hosts";

    if [ -n "$(grep $HOSTNAME /etc/hosts)" ]
    then
        echo "$HOSTNAME was added successfully to /etc/hosts";
    else
        echo "Failed to Add $HOSTNAME, Try again!";
    fi
fi

echo "Docker registry will be available at k3d-mashroomregistry.localhost:12345"

# Setup a cluster with a registry and three namespaces: portal, test1, test2
echo "Creating cluster $CLUSTER"
k3d cluster create ${CLUSTER} --agents 1 -p "8085:80@loadbalancer" --registry-use mashroomregistry.localhost:12345
kubectl config use-context k3d-${CLUSTER}

kubectl apply -f namespaces.yaml
envsubst < ingress.yaml | kubectl apply -f -

echo "Cluster created. Loadbalancer will be at http://localhost:8085"
