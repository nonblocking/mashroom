
import {VHOST_MAPPING_INFO_REQUEST_PROP_NAME} from "../constants";

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomVHostPathMapperService as MashroomVHostPathMapperServiceType,
    RequestVHostMappingInfo
} from '../../type-definitions';

export default class MashroomVHostPathMapperService implements MashroomVHostPathMapperServiceType {

    getMappingInfo(request: ExpressRequest): RequestVHostMappingInfo | undefined {
       // @ts-ignore
       return request[VHOST_MAPPING_INFO_REQUEST_PROP_NAME];
   }
}
