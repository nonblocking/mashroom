import type {MashroomImportMapConnector, ImportMap} from '../../../../type-definitions/internal';

const connector: MashroomImportMapConnector = {
    getImportMap(): ImportMap | undefined {
        return System.getImportMap();
    },
    addImportMap(importMap: ImportMap): void {
        System.addImportMap(importMap);
    }
};

export default connector;
