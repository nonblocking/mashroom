
import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityProvider,
    MashroomSecurityService,
    MashroomSecurityUser,
    MashroomSecurityAuthenticationResult,
    MashroomSecurityLoginResult
} from '@mashroom/mashroom-security/type-definitions';

export default class MashroomBasicWrapperSecurityProvider implements MashroomSecurityProvider {

    constructor(private targetSecurityProvider: string, private onlyPreemptive: boolean, private realm: string) {
    }

    async canAuthenticateWithoutUserInteraction(request: ExpressRequest): Promise<boolean> {
        const authorization = this.getAuthorizationHeader(request);
        return !!authorization && authorization.startsWith('Basic ');
    }

    async authenticate(request: ExpressRequest, response: ExpressResponse, authenticationHints?: any): Promise<MashroomSecurityAuthenticationResult> {
        const logger = request.pluginContext.loggerFactory('mashroom.security.provider.basic');

        const authorization = this.getAuthorizationHeader(request);
        if (authorization && authorization.startsWith('Basic ')) {
            const token = authorization.split(' ')[1];
            const buff = Buffer.from(token, 'base64');
            const userPwd = buff.toString('ascii');
            const [username, password] = userPwd.split(':');

            const result = await this.login(request, username, password);
            if (result.success) {
                return {
                    status: 'authenticated',
                };
            } else {
                logger.warn(`Basic authentication failed for user: ${username}`);
            }
        }

        if (!this.onlyPreemptive) {
            response.setHeader('WWW-Authenticate', `Basic realm="${this.realm}"`);
            response.sendStatus(401);

            return {
                status: 'deferred',
            };
        }

        const targetSecurityProvider = this.getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            return targetSecurityProvider.authenticate(request, response, authenticationHints);
        }

        return {
            status: 'error',
        };
    }

    async checkAuthentication(request: ExpressRequest): Promise<void> {
        const targetSecurityProvider = this.getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            await targetSecurityProvider.checkAuthentication(request);
        }
    }

    getAuthenticationExpiration(request: ExpressRequest): number | undefined | null {
        const targetSecurityProvider = this.getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            return targetSecurityProvider.getAuthenticationExpiration(request);
        }
        return null;
    }

    async revokeAuthentication(request: ExpressRequest): Promise<void> {
        const targetSecurityProvider = this.getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            await targetSecurityProvider.revokeAuthentication(request);
        }
    }

    async login(request: ExpressRequest, username: string, password: string): Promise<MashroomSecurityLoginResult> {
        const targetSecurityProvider = this.getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            return targetSecurityProvider.login(request, username, password);
        }
        return {
            success: false,
            failureReason: 'Login not supported'
        }
    }

    getUser(request: ExpressRequest): MashroomSecurityUser | undefined | null {
        const targetSecurityProvider = this.getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            return targetSecurityProvider.getUser(request);
        }
        return null;
    }

    private getAuthorizationHeader(request: ExpressRequest): string | undefined {
        return request.headers.authorization;
    }

    private getTargetSecurityProvider(request: ExpressRequest): MashroomSecurityProvider | null {
        const securityService: MashroomSecurityService = request.pluginContext.services.security.service;
        const provider = securityService.getSecurityProvider(this.targetSecurityProvider);
        if (!provider) {
            const logger = request.pluginContext.loggerFactory('mashroom.security.provider.basic');
            logger.error(`Security provider not found: ${this.targetSecurityProvider}`);
            return null;
        }
        return provider;
    }
}
