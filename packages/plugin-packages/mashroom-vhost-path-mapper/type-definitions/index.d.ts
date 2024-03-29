
import type {Request} from 'express';

export type RequestVHostMappingInfo = {
    /**
     * The key of the mapping rule used
     */
    readonly mappingRuleBasePath: string;
    /**
     * The original URL before mapping (as seen by Node.js)
     */
    readonly originalUrl: string;
    /**
     * The frontendPath from the vhost definition
     */
    readonly frontendBasePath: string;
    /**
     * The frontend path seen by the user
     */
    readonly frontendPath: string;
    /**
     * The full frontend url seen by the user (including query and so on)
     */
    readonly frontendUrl: string;
}

export interface MashroomVHostPathMapperService {
    /**
     * Reverse map the given server url to the url as seen by the user (browser).
     * The given URL must not contain host, only path with query params and so on.
     */
    getFrontendUrl(req: Request, url: string): string;

    /**
     * Get the details if the url of the current path has been rewritten
     */
    getMappingInfo(req: Request): RequestVHostMappingInfo | undefined;
}

