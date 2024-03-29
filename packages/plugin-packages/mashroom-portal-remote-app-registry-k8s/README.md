
# Mashroom Portal Remote App Registry for Kubernetes

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

Adds a remote app registry to _Mashroom Portal_ which periodically scans Kubernetes services that expose Remote Portal Apps.
It expects the _package.json_ and optionally an external plugin config file (default _mashroom.json_) to be exposed at _/_.
It also expects a _remote_ config in the plugin definition, like this:

```json
 {
    "name": "My Single Page App",
    "remote": {
        "resourcesRoot": "/public",
         "ssrInitialHtmlPath": "/ssr"
    }
 }
```

You can find an example remote app here: [Mashroom Demo Remote Portal App](https://github.com/nonblocking/mashroom-demo-remote-portal-app).

This plugin also comes with an Admin UI extension (_/mashroom/admin/ext/remote-portal-apps-k8s_) that can be used to check all registered Apps.

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
          "unregisterAppsAfterScanErrors": -1,
          "accessViaClusterIP": false,
          "serviceProcessingBatchSize": 20
        }
    }
}
```

 * _cronSchedule_: The cron schedule for the background job that scans for new apps (Default: every minute)
 * _k8sNamespacesLabelSelector_: Label selector(s) for namespaces, can be a single string or an array (e.g. environment=development,tier=frontend) (Default: null)
 * _k8sNamespaces_: A distinct list of Kubernetes namespaces to scan; can be null if _k8sNamespacesLabelSelector_ is set (Default: ["default"])
 * _k8sServiceLabelSelector_: Label selector(s) for services, can be a single string or an array (e.g. microfrontend=true) (Default: null)
 * _serviceNameFilter_: A regular expression for services that should be checked (case-insensitive). (Default: ".*")
 * _socketTimeoutSec_: Socket timeout when trying to the Kubernetes service (Default: 3)
 * _checkIntervalSec_: The time in seconds after that a registered services show be re-checked (Default: 600)
 * _unregisterAppsAfterScanErrors_: Remove registered Apps of a service if it cannot be reached for a number of scan intervals (Default: -1 which means: never remove)
 * _accessViaClusterIP_: Access services via IP address and not via &lt;name&gt;.&lt;namespace&gt; (Default: false)
 * _serviceProcessingBatchSize_: Number of services that should be processed in parallel at a time (Default: 20)

The list of successful registered services will be available on **http://&lt;host&gt;:&lt;port&gt;/portal-remote-app-registry-kubernetes**

**A more complex example**

Select all services with label microfrontend=true and not label channel=alpha in all namespaces with label environment=development and tier=frontend:

```json
{
  "plugins": {
      "Mashroom Portal Remote App Kubernetes Background Job": {
          "k8sNamespacesLabelSelector": ["environment=development,tier=frontend"],
          "k8sNamespaces": null,
          "k8sServiceLabelSelector": ["microfrontend=true,channel!=alpha"]
        }
    }
}
```
### Priority

In case of duplicate Portal Apps the one that appears first in the list of namespaces is taken.
For a configuration like this:

```json
{
  "k8sNamespacesLabelSelector": ["environment=hotfix", "environment=prod"],
  "k8sNamespaces": ["namespace2"]
}
```
the order is:
 * Namespaces that match *environment=hotfix*
 * Namespaces that match *environment=prod*
 * Namespace *namespace2*

## Setup Kubernetes access

In order to allow Mashroom to fetch services for given namespaces you need to attach a Kubernetes **Service Account** with the correct permissions to the deployment.

Create a role with the required permissions like this:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: list-namespaces-services-cluster-role
rules:
  - apiGroups:
      - ""
    resources:
      - services
      - namespaces
    verbs:
      - get
      - list
```
And then create the Service Account and bind the role
(we use a *ClusterRoleBinding* here so the account can read services in **all** namespaces in the cluster, if you don't want that, you have to create a *RoleBinding* per allowed namespace):

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: mashroom-portal
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: mashroom-portal-role-binding
subjects:
  - kind: ServiceAccount
    name: mashroom-portal
    namespace: default
roleRef:
  kind: ClusterRole
  name: list-namespaces-services-cluster-role
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
