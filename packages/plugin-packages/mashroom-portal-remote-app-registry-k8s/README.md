
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
      "Mashroom Portal Remote App Kubernetes Background Job": {
          "cronSchedule": "0/1 * * * *",
          "k8sNamespacesLabelSelector": null,
          "k8sNamespaces": ["default"],
          "k8sServiceLabelSelector": null,
          "serviceNameFilter": "(microfrontend-|widget-)",
          "socketTimeoutSec": 3,
          "refreshIntervalSec": 600,
          "accessViaClusterIP": false
        }
    }
}
```

 * _cronSchedule_: The cron schedule for the background job that scans for new apps (Default: every minute)
 * _k8sNamespacesLabelSelector_: Search in all namespaces matching the label selector (e.g. environment=development,tier=frontend) (Default: null)
 * _k8sNamespaces_: A distinct list of Kubernetes namespaces to scan, should be null if _k8sNamespacesLabelSelector_ is set (Default: ["default"])
 * _k8sServiceLabelSelector_: Search for services in the selected namespaces with given labels (e.g. microfrontend=true) (Default: null)
 * _serviceNameFilter_: A regular expression for services that should be checked (case insensitive). (Default: ".*")
 * _socketTimeoutSec_: Socket timeout when trying to the Kubernetes service (Default: 3)
 * _checkIntervalSec_: The time in seconds after that a registered services show be re-checked (Default: 600)
 * _accessViaClusterIP_: Access services via IP address and not via &lt;name&gt;.&lt;namespace&gt; (Default: false)

The list of successful registered services will be available on **http://&lt;host&gt;:&lt;port&gt;/portal-remote-app-registry-kubernetes**

**A more complex example**

Select all services with label microfrontend=true and not label channel=alpha in all namespaces with label environment=development and tier=frontend:

```json
{
  "plugins": {
      "Mashroom Portal Remote App Kubernetes Background Job": {
          "k8sNamespacesLabelSelector": "environment=development,tier=frontend",
          "k8sNamespaces": null,
          "k8sServiceLabelSelector": "microfrontend=true,channel!=alpha"
        }
    }
}
```

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
