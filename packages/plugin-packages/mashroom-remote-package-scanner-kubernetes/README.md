
# Mashroom Remote Package Scanner Kubernetes

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugin scans for remote plugin packages in a Kubernetes cluster.
It *watches* Kubernetes namespaces and services with given labels which will be checked for plugins.

It also watches Pods for new image versions and removes plugin packages if no running Pod can be found.

> [!IMPORTANT]
> A remote plugin package **must** expose a definition file, typically */mashroom.json*.
> You can use a *mashroom-server.com/remote-plugins-definition-path* annotation on the K8S service to tell Mashroom where to find it.

Currently, only the following plugin types are known to be supported:

* portal-app
* portal-app2
* portal-layouts
* portal-page-enhancement (only if no bootstrap is defined)

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **@mashroom/mashroom-remote-package-scanner-kubernetes** as *dependency*.

You can override the default config in your Mashroom server config like this:

```json
{
  "plugins": {
      "Mashroom Remote Package Scanner Kubernetes": {
          "k8sNamespacesLabelSelector": ["microfrontends=true"],
          "k8sNamespaces": null,
          "k8sServiceLabelSelector": ["microfrontends=true"],
          "serviceNameFilter": ".*"
        }
    }
}
```

* _k8sNamespacesLabelSelector_: Label selector(s) for namespaces, can be a single string or an array, can also be null (Default: microfrontends=true)
* _k8sNamespaces_: A distinct list of Kubernetes namespaces to check, can be null if _k8sNamespacesLabelSelector_ is set (Default: null)
* _k8sServiceLabelSelector_: Label selector(s) for services, can be a single string or an array, can be null (Default: microfrontends=true)
* _serviceNameFilter_: A regular expression for services that should be checked (case-insensitive). (Default: ".*")

**A more complex example**

Select all services with the label *microfrontend=true* and not label *channel=alpha* in all namespaces with label *environment=development* and *tier=frontend*:

```json
{
  "plugins": {
      "Mashroom Portal Remote App Kubernetes Background Job": {
          "k8sNamespacesLabelSelector": ["environment=development,tier=frontend"],
          "k8sServiceLabelSelector": ["microfrontend=true,channel!=alpha"]
        }
    }
}
```

## Annotations

You can use annotations on Kubernetes services to help Mashroom to understand the setup:

| Annotation                                         | Description                                                                                                                                                           | Default                        |
|----------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------|
| mashroom-server.com/remote-plugins-definition-path | The path of the plugins definition                                                                                                                                    | /mashroom.json, /mashroom.yaml |
| open-microfrontends.org/microfrontends             | The server actually contains OpenMicrofrontend compliant Apps, requires [mashroom-portal-open-microfrontends-support](../mashroom-portal-open-microfrontends-support) |                                |
| open-microfrontends.org/description-path           | The path of the OpenMicrofrontends description                                                                                                                        | /microfrontends.yaml           |

## Setup Kubernetes access

This plugin uses the Kubernetes API and requires the following permissions:

 * **watch** for namespaces cluster-wide
 * **watch** for services in all namespaces with plugins (or cluster-wide)
 * **watch** for pods in all namespaces with plugins (or cluster-wide)

To allow this plugin to use the Kubernetes API you need to attach a Kubernetes **Service Account** with the correct permissions to the deployment.

Here is a possible setup with cluster-wide permissions:

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
      - pods
      - namespaces
    verbs:
      - watch
```

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

And in your deployment resource state the Service Account name:

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
