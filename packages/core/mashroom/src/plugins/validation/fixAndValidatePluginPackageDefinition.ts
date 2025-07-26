import {configUtils} from '@mashroom/mashroom-utils';
import type {URL} from 'url';
import type {MashroomLogger, MashroomPluginPackageDefinition, MashroomPluginPackageMeta} from '../../../type-definitions';

export default (packageURL: URL, def: MashroomPluginPackageDefinition, meta: MashroomPluginPackageMeta, logger: MashroomLogger): MashroomPluginPackageDefinition => {
    const fixedDef = {
        devModeBuildScript: def.devModeBuildScript,
        plugins: (def.plugins || []).map((plugin) => ({
            ...plugin,
        })),
    };

    if (!meta.name) {
        throw new Error(`Invalid package ${packageURL}: No name property!`);
    }
    if (!meta.version) {
        throw new Error(`Invalid package '${meta.name}': No version property!`);
    }

    for (const plugin of fixedDef.plugins) {
        if (!plugin.name) {
            throw new Error(`Invalid plugin definition in package '${meta.name}': No name property!`);
        }
        if (plugin.name.match(configUtils.INVALID_PLUGIN_NAME_CHARACTERS)) {
            throw new Error(`Invalid plugin definition in package '${meta.name}': Plugin '${plugin.name}' has invalid characters (/,?)!`);
        }
        if (!plugin.type) {
            throw new Error(`Invalid plugin definition in package '${meta.name}': Plugin '${plugin.name}' has no type property!`);
        }

        // Fix description
        if (!plugin.description) {
            logger.info(`Plugin '${plugin.name}' in package '${meta.name}' has no description property, using description from package.`);
            plugin.description = meta.description;
        }

        // Evaluate templates in the config object
        if (plugin.defaultConfig) {
            configUtils.evaluateTemplatesInConfigObject(plugin.defaultConfig, logger);
        }
    }

    return fixedDef;
};
