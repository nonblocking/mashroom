
import {UNDEFINED_USER_NAME} from "./constants";

import {MashroomSecurityUser} from "@mashroom/mashroom-security/type-definitions";
import {IdTokenClaims, UserinfoResponse} from "openid-client";

export default (claims: IdTokenClaims | undefined, userInfo: UserinfoResponse | undefined | null, rolesClaimName: string | undefined | null, adminRoles: Array<string> = []): MashroomSecurityUser => {
    if (claims) {
        // claims can be part of the ID Tokens (claims object) or in the userInfo object
        let roles: Array<string> = [];
        if (rolesClaimName) {
            roles = (userInfo && Array.isArray(userInfo[rolesClaimName]) ? userInfo[rolesClaimName] as Array<string> : undefined) ||
                (Array.isArray(claims[rolesClaimName]) ? claims[rolesClaimName] as Array<string> : undefined) ||
                [];
        }
        const username = (userInfo && (userInfo.preferred_username || userInfo.sub || userInfo.email)) ||
            claims.preferred_username || claims.sub || claims.email || UNDEFINED_USER_NAME;
        return {
            username,
            displayName: (userInfo ? userInfo.name : claims.name) || username,
            email: userInfo ? userInfo.email : claims.email,
            pictureUrl: userInfo ? userInfo.picture : null,
            roles: roles.concat(roles.some(r => adminRoles.indexOf(r) > -1) ? ['Administrator'] : []),
        };
    } else {
        // The user is authenticated but we don't know anything about him (e.g. pure OAuth2)
        return {
            username: UNDEFINED_USER_NAME,
            displayName: UNDEFINED_USER_NAME,
            email: null,
            pictureUrl: null,
            roles: [],
        };
    }
}
