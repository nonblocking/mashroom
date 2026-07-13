
# Mashroom Portal Open Microfrontends Support

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.

This plugins loads support for registering and loading [OpenMicrofrontends](https://open-microfrontends.org) compatible Microfrontends
in the [Mashroom Portal](../mashroom-portal).

## Usage

If *node_modules/@mashroom* is configured as a plugin path, add **mashroom-portal-open-microfrontends-support** as *dependency*.

After that you can register [OpenMicrofrontends](https://open-microfrontends.org) compatible Microfrontends like any other *remote plugin*, e.g.,
by opening */mashroom/admin/ext/remote-plugin-packages* and pasting the Microfrontend URL into the form.

### Custom Extensions

This plugin supports some custom annotations for features OpenMicrofrontends doesn't support out of the box:

 * MASHROOM_ROLE_PERMISSIONS: Sames as *rolePermissions* in native Mashroom Portal Apps.
 * MASHROOM_DEFAULT_RESTRICT_VIEW_TO_ROLES: Same as *defaultRestrictViewToRoles* in native Mashroom Portal Apps.
 * MASHROOM_PROXIES_RESTRICT_TO_ROLES: Define *restrictToRoles* for specific proxies.
 * MASHROOM_META_INFO: Will be merged into *metaInfo*.

Example:

```yaml
    annotations:
        # Mashroom extensions
        MASHROOM_ROLE_PERMISSIONS:
            deleteCustomer:
            - role1
            - role2
        MASHROOM_DEFAULT_RESTRICT_VIEW_TO_ROLES:
        - role3
        MASHROOM_PROXIES_RESTRICT_TO_ROLES:
            proxy1:
            - role4
            - role5
        MASHROOM_META_INFO:
            myCustomProperty: myCustomValue
```
