
import {tlsUtils} from '@mashroom/mashroom-utils';
import MashroomLdapSecurityProvider from './MashroomLdapSecurityProvider';
import LdapClientImpl from './LdapClientImpl';

import type {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {
        loginPage, userSearchFilter, groupSearchFilter, extraDataMapping, secretsMapping,
        groupToRoleMapping: groupToRoleMappingPath, userToRoleMapping: userToRoleMappingPath,
        serverUrl, ldapConnectTimeout, ldapTimeout,
        tlsOptions, baseDN, bindDN, bindCredentials, authenticationTimeoutSec,
    } = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();
    const { loggerFactory, serverConfig: { serverRootFolder } } = pluginContext;

    const logger = loggerFactory('mashroom.security.provider.ldap');

    const fixedTlsOptions = tlsUtils.fixTlsOptions(tlsOptions, serverRootFolder, logger);
    logger.debug('Using TLS options for LDAPS:', fixedTlsOptions);

    const ldapClient = new LdapClientImpl(serverUrl, ldapConnectTimeout, ldapTimeout, baseDN, bindDN, bindCredentials, fixedTlsOptions, loggerFactory);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
       ldapClient.shutdown();
    });

    return new MashroomLdapSecurityProvider(loginPage, userSearchFilter, groupSearchFilter, extraDataMapping, secretsMapping,
        groupToRoleMappingPath, userToRoleMappingPath, ldapClient, serverRootFolder, authenticationTimeoutSec, loggerFactory);
};

export default bootstrap;
