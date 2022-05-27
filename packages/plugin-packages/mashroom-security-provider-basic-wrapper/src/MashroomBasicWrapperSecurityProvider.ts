
import type {Request, Response} from 'express';
import type {
    MashroomSecurityProvider,
    MashroomSecurityService,
    MashroomSecurityUser,
    MashroomSecurityAuthenticationResult,
    MashroomSecurityLoginResult
} from '@mashroom/mashroom-security/type-definitions';

export default class MashroomBasicWrapperSecurityProvider implements MashroomSecurityProvider {

    constructor(private _targetSecurityProvider: string, private _onlyPreemptive: boolean, private _realm: string) {
    }

    async canAuthenticateWithoutUserInteraction(request: Request): Promise<boolean> {
        const authorization = this._getAuthorizationHeader(request);
        return !!authorization && authorization.startsWith('Basic ');
    }

    async authenticate(request: Request, response: Response, authenticationHints?: any): Promise<MashroomSecurityAuthenticationResult> {
        const logger = request.pluginContext.loggerFactory('mashroom.security.provider.basic');

        const authorization = this._getAuthorizationHeader(request);
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

        if (!this._onlyPreemptive) {
            response.setHeader('WWW-Authenticate', `Basic realm="${this._realm}"`);
            response.sendStatus(401);

            return {
                status: 'deferred',
            };
        }

        const targetSecurityProvider = this._getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            return targetSecurityProvider.authenticate(request, response, authenticationHints);
        }

        return {
            status: 'error',
        };
    }

    async checkAuthentication(request: Request): Promise<void> {
        const targetSecurityProvider = this._getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            await targetSecurityProvider.checkAuthentication(request);
        }
    }

    getAuthenticationExpiration(request: Request): number | undefined | null {
        const targetSecurityProvider = this._getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            return targetSecurityProvider.getAuthenticationExpiration(request);
        }
        return null;
    }

    async revokeAuthentication(request: Request): Promise<void> {
        const targetSecurityProvider = this._getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            await targetSecurityProvider.revokeAuthentication(request);
        }
    }

    async login(request: Request, username: string, password: string): Promise<MashroomSecurityLoginResult> {
        const targetSecurityProvider = this._getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            return targetSecurityProvider.login(request, username, password);
        }
        return {
            success: false,
            failureReason: 'Login not supported'
        };
    }

    getUser(request: Request): MashroomSecurityUser | undefined | null {
        const targetSecurityProvider = this._getTargetSecurityProvider(request);
        if (targetSecurityProvider) {
            return targetSecurityProvider.getUser(request);
        }
        return null;
    }

    private _getAuthorizationHeader(request: Request): string | undefined {
        return request.headers.authorization;
    }

    private _getTargetSecurityProvider(request: Request): MashroomSecurityProvider | null {
        const securityService: MashroomSecurityService = request.pluginContext.services.security.service;
        const provider = securityService.getSecurityProvider(this._targetSecurityProvider);
        if (!provider) {
            const logger = request.pluginContext.loggerFactory('mashroom.security.provider.basic');
            logger.error(`Security provider not found: ${this._targetSecurityProvider}`);
            return null;
        }
        return provider;
    }
}
