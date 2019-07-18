// @flow

import MashroomLdapSecurityProvider from './MashroomLdapSecurityProvider';
import LdapClientImpl from './LdapClientImpl';
import fixTlsOptions from './fix_tls_options';

import type {MashroomSecurityProviderPluginBootstrapFunction} from '@mashroom/mashroom-security/type-definitions';

const bootstrap: MashroomSecurityProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {

    const {
        loginPage, userSearchFilter, groupSearchFilter, groupToRoleMapping: groupToRoleMappingPath,
        serverUrl, tlsOptions, baseDN, bindDN, bindCredentials
    } = pluginConfig;

    const pluginContext = pluginContextHolder.getPluginContext();
    const { loggerFactory, serverConfig: { serverRootFolder } } = pluginContext;

    const fixedTlsOptions = fixTlsOptions(tlsOptions, serverRootFolder, loggerFactory);
    const ldapClient = new LdapClientImpl(serverUrl, baseDN, bindDN, bindCredentials, fixedTlsOptions, loggerFactory);

    return new MashroomLdapSecurityProvider(loginPage, userSearchFilter, groupSearchFilter, groupToRoleMappingPath, ldapClient, serverRootFolder, loggerFactory);
};

export default bootstrap;
