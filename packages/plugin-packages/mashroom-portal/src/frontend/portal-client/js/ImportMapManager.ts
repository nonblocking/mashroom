import type {MashroomImportMapConnector, ImportMap} from '../../../../type-definitions/internal';
import type {MashroomPortalAppSetup} from '../../../../type-definitions';

export default class ImportMapManager {

    addImportMap(appSetup: MashroomPortalAppSetup, connector: MashroomImportMapConnector) {
        const rawImportMap = appSetup.resources.importMap ?? { imports: {}, scopes: {}, };
        const currentImportMap = connector.getImportMap() ?? { imports: {}, scopes: {}, };

        const initialModules: Array<string> = [];
        const initialModuleMapping: Record<string, string> = {};
        appSetup.resources.js.forEach((jsResource) => {
            const jsUrl = `${appSetup.resourcesBasePath}/${jsResource}`;
            const fullJsUrl = `${jsUrl}?v=${appSetup.versionHash}`;
            initialModules.push(fullJsUrl);
            // Make sure other modules find this module despite the added query
            initialModuleMapping[jsUrl] = fullJsUrl;
        });

        const importMap = {
            imports: {
                ...initialModuleMapping,
                ...rawImportMap.imports,
            },
        };

        const newImportMap: ImportMap = { imports: {}, scopes: {} };
        for (const _import in importMap.imports) {
            if (!currentImportMap.imports[_import]) {
                newImportMap.imports[_import] = importMap.imports[_import];
            } else if (currentImportMap.imports[_import] !== importMap.imports[_import]) {
                // Conflicting import map entries
                initialModules.forEach((moduleUrl) => {
                    if (!(moduleUrl in newImportMap.scopes)) {
                        newImportMap.scopes[moduleUrl] = {};
                    }
                    newImportMap.scopes[moduleUrl][_import] = importMap.imports[_import];
                    // Also make sure conflicting entries only load modules from "their" import map
                    newImportMap.scopes[importMap.imports[_import]] = {};
                    for (const _import2 in importMap.imports) {
                        if (_import2 !== _import && !initialModules.find((m) => importMap.imports[_import2] === m)) {
                            newImportMap.scopes[importMap.imports[_import]][_import2] = importMap.imports[_import2];
                        }
                    }
                });
            }
        }
        connector.addImportMap(newImportMap);
    }

}
