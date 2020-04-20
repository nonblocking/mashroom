
import type {ExpressMiddleware} from '@mashroom/mashroom/type-definitions';
import type {RequestVHostMappingInfo} from "./index";

export interface MashroomVHostPathMapperMiddleware {
    middleware(): ExpressMiddleware;
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

