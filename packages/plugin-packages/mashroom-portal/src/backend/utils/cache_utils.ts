
import {createHash} from 'crypto';

const LOAD_TS = Date.now();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {version: portalVersion} = require('../../../package.json');

let portalVersionHash: string | undefined;

export const getVersionHash = (version: string, lastReloadTs: number | null, devMode: boolean) => {
    const fullVersion = `${version}${devMode ? `-${lastReloadTs || Date.now()}` : ''}`;
    return createHash('md5').update(fullVersion).digest('hex').substring(0, 10);
};

export const getPortalVersionHash = (devMode: boolean) => {
    if (portalVersionHash) {
        return portalVersionHash;
    }
    portalVersionHash = getVersionHash(portalVersion, LOAD_TS, devMode);
    return portalVersionHash;
};

