
import {ExpressRequest} from '@mashroom/mashroom/type-definitions';

export type ExpressRequestWithSession = ExpressRequest & {
    session: any;
}
