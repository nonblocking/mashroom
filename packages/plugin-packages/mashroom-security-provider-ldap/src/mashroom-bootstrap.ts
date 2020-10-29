
import MashroomLdapSecurityProvider from './MashroomLdapSecurityProvider';
import LdapClientImpl from './LdapClientImpl';
import fixTlsOptions from './fix_tls_options';

import type {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {
        loginPage, userSearchFilter, groupSearchFilter, extraDataMapping, secretsMapping,
        groupToRoleMapping: groupToRoleMappingPath, serverUrl, ldapConnectTimeout, ldapTimeout,
        tlsOptions, baseDN, bindDN, bindCredentials, authenticationTimeoutSec,
    } = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();
    const { loggerFactory, serverConfig: { serverRootFolder } } = pluginContext;

    const fixedTlsOptions = fixTlsOptions(tlsOptions, serverRootFolder, loggerFactory);
    const ldapClient = new LdapClientImpl(serverUrl, ldapConnectTimeout, ldapTimeout, baseDN, bindDN, bindCredentials, fixedTlsOptions, loggerFactory);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
       ldapClient.shutdown();
    });

    return new MashroomLdapSecurityProvider(loginPage, userSearchFilter, groupSearchFilter, extraDataMapping, secretsMapping,
        groupToRoleMappingPath, ldapClient, serverRootFolder, authenticationTimeoutSec, loggerFactory);
};

export default bootstrap;
