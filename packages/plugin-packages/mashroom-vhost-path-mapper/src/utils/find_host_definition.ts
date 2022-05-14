
import type {
    DeterminedHost,
    VHostDefinition,
    VHostDefinitions,
} from '../../type-definitions/internal';

export default (determinedHost: DeterminedHost, vhostDefinitions: VHostDefinitions): VHostDefinition | undefined => {
    if (Object.keys(vhostDefinitions).length === 0) {
        return undefined;
    }

    const hostNames = Object.keys(vhostDefinitions);
    for (let i = 0; i < hostNames.length; i ++) {
        const hostname = hostNames[i];
        if (hostname.indexOf(':') !== -1) {
           if (determinedHost.port && hostname === `${determinedHost.hostname}:${determinedHost.port}`) {
                return vhostDefinitions[hostname];
            }
        } else if (hostname === determinedHost.hostname) {
            return vhostDefinitions[hostname];
        }
    }

    return undefined;
};
