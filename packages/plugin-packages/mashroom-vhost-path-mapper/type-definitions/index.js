// @flow

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';

export type RequestVHostMappingInfo = {
    /**
     * The key of the mapping rule used
     */
    +mappingRuleBasePath: string;
    /**
     * The original URL before mapping (as seen by Node.js)
     */
    +originalUrl: string;
    /**
     * The frontendPath from the vhost definition
     */
    +frontendBasePath: string;
    /**
     * The full frontend path seen by the user (browser)
     */
    +frontendPath: string;
    /**
     * The full frontend url seen by the user (including query and so on)
     */
    +frontendUrl: string;
}

export interface MashroomVHostPathMapperService {
    /**
     * Reverse map the given server url to the url as seen by the user (browser).
     * The given URL must not contain host, only path with query params and so on.
     */
    getFrontendUrl(req: ExpressRequest, url: string): string;

    /**
     * Get the details if the url of the current path has been rewritten
     */
    getMappingInfo(req: ExpressRequest): ?RequestVHostMappingInfo;
}
