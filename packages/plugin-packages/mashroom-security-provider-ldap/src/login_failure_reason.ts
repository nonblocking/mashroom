
// Active Directory errors
import {MashroomSecurityLoginFailureReason} from '@mashroom/mashroom-security/type-definitions';

const AD_LOGIN_ERRORS: Record<string, string> = {
    USER_NOT_FOUND: '525',
    INVALID_CREDENTIALS: '52e',
    NOT_PERMITTED_TO_LOGON_TIME: '530',
    NOT_PERMITTED_TO_LOGON_WORKSTATION: '531',
    PASSWORD_EXPIRED: '532',
    ACCOUNT_DISABLED: '533',
    LOGON_TYPE_NOT_GRANTED: '534',
    ACCOUNT_EXPIRED: '701',
    MUST_RESET_PASSWORD: '773',
    ACCOUNT_LOCKED: '775',
}

const AD_ERROR_MESSAGE_REGEX = /.*DSID-.*, data ([0-9a-f]{3}),.*/;

export default (errorMessage: string | undefined | null): MashroomSecurityLoginFailureReason | undefined => {
    if (!errorMessage) {
        return;
    }

    const adMatch = errorMessage.match(AD_ERROR_MESSAGE_REGEX);
    if (adMatch) {
        const adErrorCode = adMatch[1];
        switch (adErrorCode) {
            case AD_LOGIN_ERRORS.USER_NOT_FOUND:
                return 'User not found';
            case AD_LOGIN_ERRORS.INVALID_CREDENTIALS:
                return 'Invalid credentials';
            case AD_LOGIN_ERRORS.MUST_RESET_PASSWORD:
            case AD_LOGIN_ERRORS.PASSWORD_EXPIRED:
                return 'Password expired';
            case AD_LOGIN_ERRORS.ACCOUNT_DISABLED:
                return 'Account disabled';
            case AD_LOGIN_ERRORS.ACCOUNT_EXPIRED:
                return 'Account expired';
            case AD_LOGIN_ERRORS.ACCOUNT_LOCKED:
                return 'Account locked';
            case AD_LOGIN_ERRORS.NOT_PERMITTED_TO_LOGON_TIME:
            case AD_LOGIN_ERRORS.NOT_PERMITTED_TO_LOGON_WORKSTATION:
            case AD_LOGIN_ERRORS.LOGON_TYPE_NOT_GRANTED:
                return 'Login not permitted';
        }
    }
}
