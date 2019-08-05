
### Mashroom Security Simple Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Integration Platform for Microfrontends**. 

This plugin adds a simple, JSON file based security provider.

#### Usage

If _node_modules/@mashroom_ is configured as plugin path just add this package as _dependency_.

To activate this provider configure the _Mashroom Security_ plugin like this:

```json
{
    "plugins": {
        "Mashroom Security Services": {
            "provider": "Mashroom Security Simple Provider"
        }
    }
}
```

And configure this plugin like this in the Mashroom config file:

```json
{
  "plugins": {
        "Mashroom Security Simple Provider": {
            "users": "./users.json",
            "loginPage": "/login"
        }
    }
}
```

 * _users_: The path to the JSON file with user and role definitions (Default: ./users.json)
 * _loginPage_: The path to redirect if a restricted resource is requested but the user not logged in yet (Default: /login)
 
 The content of the JSON file might look like this.
 
 ```json
[
    {
        "username": "admin",
        "displayName": "Administrator",
        "passwordHash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
        "roles": [
            "Administrator"
        ]
    },
    {
        "username": "john",
        "displayName": "John Do",
        "passwordHash": "96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a",
        "roles": [
            "User",
            "PowerUser"
        ]
    }
]

```

The _passwordHash_ is the SHA256 hash of the password.
