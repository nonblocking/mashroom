
import type {RequestHandler} from 'express';
import type {RequestVHostMappingInfo} from './index';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            __vhostMappingInfo?: RequestVHostMappingInfo;
        }
    }
}



export interface MashroomVHostPathMapperMiddleware {
    middleware(): RequestHandler;
}

export type VHostMappingRules = {
    readonly [path: string]: string;
}

export type VHostDefinition = {
    frontendBasePath?: string;
    mapping: VHostMappingRules;
}

export type VHostDefinitions = {
    readonly [host: string]: VHostDefinition;
};

type DeterminedHost = {
    hostname: string;
    port: string | undefined;
}

type MappingResult = {
    url: string;
    info: RequestVHostMappingInfo;
}

