import {fileURLToPath} from 'url';
import {readonlyUtils} from '@mashroom/mashroom-utils';
import type {URL} from 'url';
import type {
    MashroomPluginPackage as MashroomPluginPackageType,
    MashroomPluginPackageStatus,
    MashroomPluginPackageDefinition,
    MashroomPluginPackageMeta,
} from '../../type-definitions';

export default class MashroomPackagePlugin implements MashroomPluginPackageType {

    private _status: MashroomPluginPackageStatus;
    private _errorMessage: string | undefined | null;

    constructor(private _pluginPackageUrl: URL, private _pluginPackageDefinition: MashroomPluginPackageDefinition,
                private _pluginPackageMeta: MashroomPluginPackageMeta) {
        this._status = 'pending';
        this._errorMessage = null;
    }

    get name() {
        return this._pluginPackageMeta.name;
    }

    get description() {
        return this._pluginPackageMeta.description;
    }

    get version() {
        return this._pluginPackageMeta.version;
    }

    get homepage() {
        return this._pluginPackageMeta.homepage;
    }

    get author(){
        return this._pluginPackageMeta.author;
    }

    get license() {
        return this._pluginPackageMeta.license;
    }

    get pluginPackageUrl() {
        return this._pluginPackageUrl;
    }

    get pluginPackagePath() {
        if (this._pluginPackageUrl.protocol === 'file:') {
            return fileURLToPath(this._pluginPackageUrl);
        }
        return '';
    }

    get devModeBuildScript() {
        return this._pluginPackageDefinition.devModeBuildScript;
    }

    get pluginDefinitions() {
        return readonlyUtils.cloneAndFreezeArray(this._pluginPackageDefinition.plugins);
    }

    get status() {
        return this._status;
    }

    get errorMessage() {
        return this._errorMessage;
    }

    setStatus(status: MashroomPluginPackageStatus) {
        this._status = status;
    }

    setErrorMessage(errorMessage: string | null) {
        this._errorMessage = errorMessage;
    }
}

