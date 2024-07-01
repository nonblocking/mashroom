
import loginFailureReason from '../src/login-failure-reason';

describe('login_failure_reason', () => {

    it('processes an empty message correctly', async () => {
        expect(loginFailureReason('')).toBeUndefined();
    });

    it('processes an unknown error message correctly', async () => {
        expect(loginFailureReason('Something unexpected happened')).toBeUndefined();
    });

    it('detects Active Directory error codes correctly', async () => {
        expect(loginFailureReason('INVALID_CREDENTIALS: 80090308: LdapErr: DSID-0C09042F, comment: AcceptSecurityContext error, data 52e, v2580')).toBe('Invalid credentials');
        expect(loginFailureReason('INVALID_CREDENTIALS: 80090308: LdapErr: DSID-0C090400, comment: AcceptSecurityContext error, data 775, v1db1')).toBe('Account locked');
    });
});
