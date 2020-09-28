
import {createServer, InvalidCredentialsError} from 'ldapjs';

const KNOWN_USERS: any = {
    'cn=john, ou=test, ou=users, dc=at, dc=nonblocking': 'john',
    'cn=admin, ou=test, ou=users, dc=at, dc=nonblocking': 'test',
}

const server = createServer();

server.bind('OU=test,OU=users,DC=at,DC=nonblocking', (req: any, res: any, next: (error?: any) => void) => {
    const user = req.dn.toString();
    console.info('Bind request', user);
    if (KNOWN_USERS[user] !== req.credentials) {
        return next(new InvalidCredentialsError());
    }
    res.end();
    return next();
});

server.search('OU=test,OU=users,DC=at,DC=nonblocking', (req: any, res: any) => {
    console.info('Search request', req.filter);

    const uid = req.filter.filters[1].raw.toString();
    if (uid === 'john') {
        const entry: any = {
            dn: 'cn=john,ou=test,ou=users,dc=at,dc=nonblocking',
            attributes: {
                a: ['top', 'organization', 'person'],
                o: ['at', 'nonblocking']
            }
        };
        res.send(entry);
    }

    res.end();
});

export const startMockLdapServer = async (): Promise<void> => {
    return new Promise((resolve) => {
        server.listen(1389, () => {
            console.log(`LDAP server listening at ${server.url}`);
            resolve();
        });
    });
};

export const stopMockLdapServer = async (): Promise<void> => {
    console.info('Remaining connections:', server.connections);
    return new Promise((resolve) => {
        server.close(() => {
            console.log(`LDAP server now closed`);
            resolve();
        });
    });
};

