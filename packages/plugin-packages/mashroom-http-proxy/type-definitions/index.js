// @flow

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';

export type HttpHeaders = {
    [string]: string,
}

export interface HttpHeaderFilter {
    filter(headers: HttpHeaders): void;
}

export interface MashroomHttpProxyService {

    /**
     * Forwards the given request to the targetUri and passes the response from the target to the response object.
     * The Promise will always resolve, you have to check response.statusCode to see if the transfer was successful or not.
     * The Promise will resolve as soon as the whole response was sent to the client.
     */
    forward(req: ExpressRequest, res: ExpressResponse, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void>;

}
