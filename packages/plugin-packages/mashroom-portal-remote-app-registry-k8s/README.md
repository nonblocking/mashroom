
# Mashroom Portal Remote App Registry for Kubernetes

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**.

Adds a remote app registry to _Mashroom Portal_. Scans periodically Kubernetes namespaces for services that
expose Remote Portal Apps (actually it scans for exposed /package.json containing a _mashroom_ property).
You can find an example remote app here: [Mashroom Demo Remote Portal App](https://github.com/nonblocking/mashroom-demo-remote-portal-app).

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom/mashroom-portal-remote-app-registry-k8s** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
  "plugins": {
      "Mashroom Portal Remote App Registry Kubernetes": {
          "k8sNamespaces": ["default"],
          "scanPeriodSec": 30,
          "refreshIntervalSec": 300,
          "serviceNameFilter": "(microfrontend-|widget-)",
          "accessViaClusterIP": false
        }
    }
}
```
 * _k8sNamespaces_: The Kubernetes namespaces to scan (Default: ["default"])
 * _scanPeriodSec_: The interval in seconds for scans (Default: 30)
 * _checkIntervalSec_: The time in seconds after that a registered services show be re-checked (Default: 300)
 * _serviceNameFilter_: A regular expression for services that should be checked (case insensitive). (Default: ".*")
 * _accessViaClusterIP_: Access services via IP address and not via &lt;name&gt;.&lt;namespace&gt; (Default: false)

The list of successful registered services will be available on **http://&lt;host&gt;:&lt;port&gt;/portal-remote-app-registry-kubernetes**

## Setup Kubernetes access

In order to allow Mashroom to fetch services for given namespaces you need to attach a Kubernetes **Service Account** with the correct permissions to the deployment.

Create a role with the required permissions like this:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
    name: list-services-cluster-role
rules:
    -   apiGroups:
            - ""
        resources:
            - services
        verbs:
            - get
            - list
```
And then create the Service Account and attach the role:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
    name: mashroom-portal
    namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
    name: mashroom-portal-role-binding
    namespace: default
subjects:
    -   kind: ServiceAccount
        name: mashroom-portal
roleRef:
    kind: ClusterRole
    name: list-services-cluster-role
    apiGroup: rbac.authorization.k8s.io
```

And in your deployment resource just state the Service Account name:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: mashroom-portal
    namespace: default
spec:
    # ...
    template:
        # ...
        spec:
            containers:
                - name: mashroom-portal
                # ...
            serviceAccountName: mashroom-portal
```
