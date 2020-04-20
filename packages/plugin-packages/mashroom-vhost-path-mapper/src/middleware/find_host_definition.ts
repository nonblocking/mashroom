
import type {
    DeterminedHost,
    VHostDefinition,
    VHostDefinitions,
} from '../../type-definitions/internal';

export default (determinedHost: DeterminedHost, hostDefinitions: VHostDefinitions): VHostDefinition | undefined => {
    if (!hostDefinitions) {
        return undefined;
    }

    const hostNames = Object.keys(hostDefinitions);
    for (let i = 0; i < hostNames.length; i ++) {
        const hostname = hostNames[i];
        if (hostname.indexOf(':') !== -1) {
           if (determinedHost.port && hostname === `${determinedHost.hostname}:${determinedHost.port}`) {
                return hostDefinitions[hostname];
            }
        } else if (hostname === determinedHost.hostname) {
            return hostDefinitions[hostname];
        }
    }

    return undefined;
}
