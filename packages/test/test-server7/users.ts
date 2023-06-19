import type {MashroomSecuritySimpleProviderUsers} from '@mashroom/mashroom-json-schemas/type-definitions';

const users: MashroomSecuritySimpleProviderUsers = {
    users: [
        {
            username: 'admin',
            displayName: 'Administrator',
            email: 'juergen.kofler@nonblocking.at',
            passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
            roles: [
                'Administrator'
            ]
        },
        {
            username: 'john',
            displayName: 'John Do',
            passwordHash: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
            roles: [
                'Role2', 'Role5'
            ],
            extraData: {
                'test': 1
            }
        }
    ]
};

export default users;
