
import context from '../context';
import {VHOST_MAPPING_INFO_REQUEST_PROP_NAME} from '../constants';
import determineHost from '../utils/determine_host';
import find_host_definition from '../utils/find_host_definition';
import mapPath from '../utils/map_path';

import type {Request} from 'express';
import type {
    MashroomVHostPathMapperService as MashroomVHostPathMapperServiceType,
    RequestVHostMappingInfo
} from '../../type-definitions';

export default class MashroomVHostPathMapperService implements MashroomVHostPathMapperServiceType {

    getFrontendUrl(req: Request, url: string): string {
        const host = determineHost(req, context.considerHttpHeaders);
        const hostDefinition = find_host_definition(host, context.vhostDefinitions);
        if (hostDefinition) {
            const redirectMappingResult = mapPath(url, hostDefinition, true);
            if (redirectMappingResult) {
                return redirectMappingResult.url;
            }
        }

        return url;
    }

    getMappingInfo(req: Request): RequestVHostMappingInfo | undefined {
        return req[VHOST_MAPPING_INFO_REQUEST_PROP_NAME];
    }
}
