import {fileURLToPath} from 'url';
import {readFile} from 'fs/promises';
import {resolve} from 'path';
import {getExternalPluginDefinitionFilePath} from '../../../utils/plugin-utils';
import type {
    MashroomLogger,
    MashroomLoggerFactory, MashroomPluginPackageDefinition,
    MashroomPluginPackageDefinitionAndMeta,
    MashroomPluginPackageDefinitionBuilder, MashroomPluginPackageMeta,
    MashroomServerConfig
} from '../../../../type-definitions';
import type {URL} from 'url';

export default class MashroomDefaultPluginPackageDefinitionBuilder implements MashroomPluginPackageDefinitionBuilder {

    private readonly _logger: MashroomLogger;
    private readonly _externalPluginConfigFileNames: Array<string>;

    constructor(config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.definition.builder');
        this._externalPluginConfigFileNames = config.externalPluginConfigFileNames;
    }

    get name() {
        return 'Default local file system definition builder based on package.json and external plugin defintions';
    }

    async buildDefinition(url: URL): Promise<MashroomPluginPackageDefinitionAndMeta | null> {
        if (url.protocol !== 'file:') {
            return null;
        }

        const pluginPackagePath = fileURLToPath(url);

        let packageJson = null;
        try {
            packageJson = await this._readPackageJson(pluginPackagePath);
        } catch (err) {
            this._logger.error(`Error reading package.json in: ${pluginPackagePath}`, err);
            return null;
        }

        const meta: MashroomPluginPackageMeta = {
            name: packageJson.name,
            description: packageJson.description,
            version: packageJson.version,
            homepage: packageJson.homepage,
            author: this._authorToString(packageJson.author),
            license: packageJson.license,
        };

        let definition = this._readExternalPluginConfigFile(pluginPackagePath);
        if (!definition && packageJson.mashroom) {
            definition = packageJson.mashroom;
        }

        if (!definition) {
            this._logger.error(`No plugin definition found in: ${pluginPackagePath}. Neither does package.json contain a "mashroom" property nor does an external plugin definition file exist.`);
            return null;
        }
        if (!definition.plugins || !Array.isArray(definition.plugins)) {
            this._logger.error(`Error processing plugin definition in: ${pluginPackagePath}: "plugins" is either not defined or no array!`);
            return null;
        }

        return {
            definition,
            meta,
        };
    }

    private async _readPackageJson(pluginPackagePath: string): Promise<any> {
        const fileData = await readFile(resolve(pluginPackagePath, 'package.json'), 'utf-8');
        return JSON.parse(fileData.toString());
    }

    private _readExternalPluginConfigFile(pluginPackagePath: string): MashroomPluginPackageDefinition | undefined {
        const externalPluginConfigFile = getExternalPluginDefinitionFilePath(pluginPackagePath, this._externalPluginConfigFileNames);
        if (!externalPluginConfigFile) {
            return;
        }

        this._logger.debug('Loading plugin config file:', externalPluginConfigFile);

        // Reload
        delete require.cache[externalPluginConfigFile];
        try {
            const pluginConfigModule = require(externalPluginConfigFile);
            return pluginConfigModule.default ?? pluginConfigModule;
        } catch (e) {
            this._logger.error(`Error processing plugin definition in: ${externalPluginConfigFile}: File exists but is not readable!`, e);
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
