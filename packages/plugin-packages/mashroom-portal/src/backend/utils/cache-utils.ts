
import {createHash} from 'crypto';
import context from '../context/global-portal-context';

const LOAD_TS = Date.now();
 
const {version: portalVersion} = require('../../../package.json');

let portalVersionHash: string | undefined;

export const getVersionHash = (version: string, lastReloadTs: number | null, devMode: boolean) => {
    const fullVersion = `${version}${devMode ? `-${lastReloadTs || Date.now()}` : ''}`;
    const hash = createHash('md5');
    const {versionHashSalt} = context.portalPluginConfig;
    if (versionHashSalt) {
        hash.update(versionHashSalt);
    }
    return hash.update(fullVersion).digest('hex').substring(0, 10);
};

export const getPortalVersionHash = (devMode: boolean) => {
    if (portalVersionHash) {
        return portalVersionHash;
    }
    portalVersionHash = getVersionHash(portalVersion, LOAD_TS, devMode);
    return portalVersionHash;
};

