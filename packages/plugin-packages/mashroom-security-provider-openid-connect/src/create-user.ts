
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {IDToken, UserInfoResponse} from 'openid-client';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

export default (
    claims: IDToken | undefined,
    userInfo: UserInfoResponse | undefined | null,
    rolesClaimName: string | undefined | null,
    adminRoles: Array<string> = [],
    extraDataMapping: Record<string, string> | undefined | null,
    logger: MashroomLogger,
): MashroomSecurityUser => {
    if (claims) {
        // claims can be part of the ID Tokens (claims object) or in the userInfo object
        let roles: Array<string> = [];
        if (rolesClaimName) {
            roles = (userInfo && Array.isArray(userInfo[rolesClaimName]) ? userInfo[rolesClaimName] as Array<string> : undefined) ||
                (Array.isArray(claims[rolesClaimName]) ? claims[rolesClaimName] as Array<string> : undefined) ||
                [];
        }

        const username = (userInfo && (userInfo.preferred_username || userInfo.sub || userInfo.email)) ||
            claims.preferred_username as string | undefined || claims.sub || claims.email as string | undefined  || '';

        let extraData: any = null;
        if (extraDataMapping) {
            extraData = {};
            Object.keys(extraDataMapping).forEach((extraDataPropName) => {
                const claimName = extraDataMapping[extraDataPropName];
                extraData[extraDataPropName] = userInfo?.[claimName] || claims[claimName] || null;
            });
        }

        return {
            username,
            displayName: (userInfo ? userInfo.name : claims.name as string | undefined ) || username,
            email: userInfo ? userInfo.email : claims.email as string | undefined,
            pictureUrl: userInfo ? userInfo.picture : null,
            extraData,
            roles: roles.concat(roles.some(r => adminRoles.indexOf(r) > -1) ? ['Administrator'] : []),
            secrets: null,
        };
    } else {
        logger.warn('User is authenticated be no claims or user info available!');
        return {
            username: '',
            displayName: '',
            email: null,
            pictureUrl: null,
            extraData: null,
            roles: [],
            secrets: null,
        };
    }
};
