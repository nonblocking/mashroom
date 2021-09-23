
import {VHOST_MAPPING_INFO_REQUEST_PROP_NAME} from '../constants';

import type {Request} from 'express';
import type {
    MashroomVHostPathMapperService as MashroomVHostPathMapperServiceType,
    RequestVHostMappingInfo
} from '../../type-definitions';

export default class MashroomVHostPathMapperService implements MashroomVHostPathMapperServiceType {

    getMappingInfo(request: Request): RequestVHostMappingInfo | undefined {
        return request[VHOST_MAPPING_INFO_REQUEST_PROP_NAME];
    }
}
