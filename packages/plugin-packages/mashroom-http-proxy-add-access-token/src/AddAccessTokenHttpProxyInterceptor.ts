import type {Request, Response} from 'express';
import type {IncomingMessageWithContext, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomHttpProxyInterceptor, HttpHeaders, QueryParams, MashroomHttpProxyRequestInterceptorResult, MashroomWsProxyRequestInterceptorResult} from '@mashroom/mashroom-http-proxy/type-definitions';

export default class AddAccessTokenHttpProxyInterceptor implements MashroomHttpProxyInterceptor {

    constructor(private addBearer: boolean, private accessTokenHeader: string, private targetUris: Array<string>) {
    }

    async interceptRequest(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                            clientRequest: Request, clientResponse: Response): Promise<MashroomHttpProxyRequestInterceptorResult | undefined | null> {
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy.addAccessToken');
        const securityService: MashroomSecurityService = clientRequest.pluginContext.services.security!.service;
        const user = securityService.getUser(clientRequest);
        const addHeaders = this.addHeaders(targetUri, user, logger);
        if (!addHeaders) {
            return null;
        }
        return {
            addHeaders,
        };
    }

    async interceptWsRequest(targetUri: string, existingHeaders: Readonly<HttpHeaders>, clientRequest: IncomingMessageWithContext): Promise<MashroomWsProxyRequestInterceptorResult | undefined | null> {
        const logger = clientRequest.pluginContext.loggerFactory('mashroom.httpProxy.addAccessToken');
        const securityService: MashroomSecurityService = clientRequest.pluginContext.services.security!.service;
        const user = securityService.getUser(clientRequest as any);
        const addHeaders = this.addHeaders(targetUri, user, logger);
        if (!addHeaders) {
            return null;
        }
        return {
            addHeaders,
        };
    }

    private addHeaders(targetUri: string, user: MashroomSecurityUser | undefined | null, logger: MashroomLogger): HttpHeaders | undefined {
        if (!user) {
            return;
        }
        const accessToken = user.secrets?.accessToken;
        if (!accessToken) {
            logger.error('Not access token found in user object');
            return;
        }

        if (!Array.isArray(this.targetUris)) {
            logger.error('Given targetUris parameter is no string array');
            return;
        }

        let match = false;
        try {
            match = this.targetUris.some((re) => targetUri.match(re));
        } catch (e) {
            logger.error('Checking uri against targetUris failed', e);
            return;
        }

        if (!match) {
            logger.debug('Don\'t add access token header to request because uri does not match', targetUri);
            return;
        }

        logger.debug('Adding access token header to request', targetUri);

        if (this.addBearer) {
            return {
                'Authorization': `Bearer ${accessToken}`,
            };
        } else {
            return {
                [this.accessTokenHeader]: accessToken,
            };
        }
    }
}
