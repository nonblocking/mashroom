import {fileURLToPath, URL} from 'url';
import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import {resolve} from 'path';
import {getExternalPluginDefinitionFilePath} from '../../../utils/plugin-utils';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPluginPackageDefinition,
    MashroomPluginPackageDefinitionAndMeta,
    MashroomPluginPackageDefinitionBuilder,
    MashroomPluginPackageMeta,
    MashroomPluginScannerHints,
    MashroomServerConfig
} from '../../../../type-definitions';

const REMOTE_DEFAULT_SOCKET_TIMEOUT_MS = 5 * 1000;

export default class MashroomDefaultPluginPackageDefinitionBuilder implements MashroomPluginPackageDefinitionBuilder {

    private readonly _logger: MashroomLogger;
    private readonly _externalPluginConfigFileNames: Array<string>;

    constructor(config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.defbuilder.default');
        this._externalPluginConfigFileNames = config.externalPluginConfigFileNames;
    }

    get name() {
        return 'Default definition builder based on package.json and external plugin definition files';
    }

    async buildDefinition(packageURL: URL, scannerHints: MashroomPluginScannerHints): Promise<Array<MashroomPluginPackageDefinitionAndMeta> | null> {
        if (!['file:', 'http:', 'https:'].includes(packageURL.protocol)) {
            return null;
        }

        const remotePackage = packageURL.protocol !== ':file';

        const packageJson = await this._readPackageJson(packageURL);

        if (!remotePackage && !packageJson) {
            // A local package requires a package.json
            this._logger.debug(`Ignoring path ${packageURL} because it does not contain a package.json`);
            return null;
        }

        let meta: MashroomPluginPackageMeta;
        if (packageJson) {
            meta = {
                name: packageJson.name,
                version: packageJson.version,
                description: packageJson.description,
                homepage: packageJson.homepage,
                author: this._authorToString(packageJson.author),
                license: packageJson.license,
            };
        } else {
            if (!scannerHints.packageVersion) {
                this._logger.warn(`Couldn't determine package version of ${packageURL} because no package.json was found! This will impact caching of assets. You should fix this.`);
            }
            meta = {
              name: scannerHints.packageName ?? packageURL.hostname,
              version: scannerHints.packageVersion ?? String(Date.now()),
                description: null,
                homepage: null,
                author: null,
                license: null,
            };
        }

        let definition = await this._readExternalPluginConfigFile(packageURL);
        if (!definition && packageJson?.mashroom) {
            definition = packageJson.mashroom;
        }

        if (!definition) {
            this._logger.error(`No plugin definition found in: ${packageURL}. Neither does package.json contain a "mashroom" property nor does an external plugin definition file exist.`);
            return null;
        }
        if (!definition.plugins || !Array.isArray(definition.plugins)) {
            this._logger.error(`Error processing plugin definition in: ${packageURL}: "plugins" is either not defined or no array!`);
            return null;
        }

        return [{
            packageURL,
            definition,
            meta,
        }];
    }

    private async _readPackageJson(url: URL): Promise<Record<string, any> | null> {
        if (url.protocol === 'file:') {
            const pluginPackagePath = fileURLToPath(url);
            if (!existsSync(pluginPackagePath) || !existsSync(resolve(pluginPackagePath, 'package.json'))) {
                return null;
            }

            const fileData = await readFile(resolve(pluginPackagePath, 'package.json'), 'utf-8');
            return JSON.parse(fileData.toString());
        }

        const packageJSON = await this._fetchRemoteJSON(new URL('package.json', url));
        if (!packageJSON) {
            return null;
        }

        if (packageJSON.mashroom) {
            delete packageJSON.mashroom.devModeBuildScript;
        }

        return packageJSON;
    }

    private async _readExternalPluginConfigFile(url: URL): Promise<MashroomPluginPackageDefinition | null> {
        if (url.protocol === 'file:') {
            const pluginPackagePath = fileURLToPath(url);

            const externalPluginConfigFile = getExternalPluginDefinitionFilePath(pluginPackagePath, this._externalPluginConfigFileNames);
            if (!externalPluginConfigFile) {
                return null;
            }

            this._logger.debug('Loading plugin config file:', externalPluginConfigFile);

            // Reload
            delete require.cache[externalPluginConfigFile];

            const pluginConfigModule = require(externalPluginConfigFile);
            return pluginConfigModule.default ?? pluginConfigModule;
        }

        for (const externalPluginConfigFileName of this._externalPluginConfigFileNames) {
            try {
                const pluginDefinition = await this._fetchRemoteJSON(new URL(`${externalPluginConfigFileName}.json`, url));
                if (pluginDefinition) {
                    delete pluginDefinition.devModeBuildScript;
                    return pluginDefinition;
                }
            } catch (e) {
                this._logger.warn(`Fetching external plugin config file ${externalPluginConfigFileName}.json from ${url} failed!`, e);
            }
        }

        return null;
    }

    private async _fetchRemoteJSON(url: URL): Promise<any> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(),  REMOTE_DEFAULT_SOCKET_TIMEOUT_MS);
        try {
            const result = await fetch(url.toString(), {
                signal: controller.signal,
            });
            if (result.ok) {
                return await result.json();
            } else if (result.status === 404) {
                this._logger.debug(`File not found: ${url}`);
                return null;
            } else {
                throw new Error(`Status code ${result.status}`);
            }
        } catch (e: any) {
            if (e.message.includes('aborted')) {
                throw new Error(`Timeout: Connection to ${url} timed out after ${REMOTE_DEFAULT_SOCKET_TIMEOUT_MS}sec`);
            }
            this._logger.error(`Fetching package.json from ${url} failed!`, e);
            throw e;
        } finally {
            clearTimeout(timeout);
        }
    }

    private _authorToString(author: string | any): string | undefined {
        if (!author) {
            return undefined;
        }
        if (typeof (author) === 'string') {
            return author;
        }
        return `${author.name || ''} <${author.email || '??'}>`;
    }

}
