import {URL} from 'url';
import fetchRemoteJSONorYAML from './fetchRemoteJSONorYAML';
import mapOpenMicrofrontendsToPortalApp2 from './mapOpenMicrofrontendsToPortalApp2';
import type {
    MashroomLogger,
    MashroomLoggerFactory, MashroomPluginPackageDefinitionAndMeta,
    MashroomPluginPackageDefinitionBuilder,
    MashroomPluginScannerHints
} from '@mashroom/mashroom/type-definitions';

const KNOWN_OPEN_MICROFRONTENDS_DESCRIPTOR_PATHS = ['/microfrontends.yaml', '/microfrontends.json'];

export default class MashroomOpenMicrofrontendsPluginPackageDefinitionBuilder implements MashroomPluginPackageDefinitionBuilder {

    #logger: MashroomLogger;

    constructor(loggerFactory: MashroomLoggerFactory) {
        this.#logger = loggerFactory('mashroom.portal.open-microfrontends');
    }

    get name(): string {
        return 'Mashroom Open Microfrontends Plugin Package Definition Builder';
    }

    async buildDefinition(packageUrl: URL, scannerHints: MashroomPluginScannerHints): Promise<Array<MashroomPluginPackageDefinitionAndMeta> | null> {
        if (packageUrl.protocol === 'file:') {
            // Ignore local packages
            return null;
        }

        this.#logger.debug(`Checking for an OpenMicrofrontends: ${packageUrl}`);

        // If there is a scanner hint that suggest that this is a native Mashroom remote package, skip it
        if (Object.keys(scannerHints).find((hint) => hint.startsWith('mashroom-server.com/'))) {
            this.#logger.debug(`Ignoring package because ${scannerHints.pluginDefinitionPath} doesn't look like a OpenMicrofrontends compatible service`);
            return null;
        }

        let descriptor: any;
        for (const path of KNOWN_OPEN_MICROFRONTENDS_DESCRIPTOR_PATHS) {
            const descriptorURL = new URL(path, packageUrl);
            try {
                descriptor = await fetchRemoteJSONorYAML(descriptorURL, this.#logger);
                if (descriptor) {
                    break;
                }
            } catch (e) {
                this.#logger.error(`Fetching OpenMicrofrontends descriptor from ${descriptorURL} failed!`, e);
            }
        }

        if (!descriptor || !('openMicrofrontends' in descriptor)) {
            this.#logger.debug(`No OpenMicrofrontends descriptor found for ${packageUrl}`);
            return null;
        }

        return [await mapOpenMicrofrontendsToPortalApp2(packageUrl, scannerHints, descriptor, this.#logger)];
    }

}
