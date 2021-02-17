
import path from 'path';
import url from 'url';
import querystring from 'querystring';
import express from 'express';
import exphbs from 'express-handlebars';
import bodyParser from 'body-parser';
import helpers, {i18nHelper} from './handlebar_helpers';
import context from './context';

import type {Request, Response} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomCSRFService} from '@mashroom/mashroom-csrf-protection/type-definitions';
import type {MashroomVHostPathMapperService} from '@mashroom/mashroom-vhost-path-mapper/type-definitions';

const app = express();

app.use(bodyParser.urlencoded({
    extended: true,
}));

app.engine('handlebars', exphbs({
    helpers,
    defaultLayout: '',
}));
app.set('view engine', 'handlebars');
app.set('views', path.resolve(__dirname, '../views'));

app.get('/', async (req: Request, res: Response) => {
    const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.login.webapp');

    try {
        const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        const lang = i18nService.getLanguage(req);
        const user = await securityService.getUser(req);
        if (user) {
            redirect(req, res);
            return;
        }

        renderLoginPage(req, res, i18nService, lang);
    } catch (e) {
        logger.error(e);
        res.sendStatus(500);
    }
});

app.get('/style.css', (req: Request, res: Response) => {
    res.sendFile(context.styleFile);
});

app.get('/assets/bg.png', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../assets/random-grey-variations.png'));
});

app.post('/', async (req: Request, res: Response) => {
    const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.login.webapp');

    try {
        // Login
        const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        const lang = i18nService.getLanguage(req);
        const user = await securityService.getUser(req);
        if (user) {
            redirect(req, res);
            return;
        }

        const username = req.body._username as string | undefined;
        const password = req.body._password as string | undefined;
        if (!username || !username.trim() || !password || !password.trim()) {
            renderLoginPage(req, res, i18nService, lang, i18nService.getMessage('loginFailed', lang));
            return;
        }

        logger.debug('Processing login attempt. Username: ', username);

        const result = await securityService.login(req, username, password);
        if (result.success) {
            redirect(req, res);
            return;
        }

        logger.warn(`Login of user ${username} failed. Reason:`, (result.failureReason || '-'), ' Details:', (result.failureReasonDetails || '-'));

        renderLoginPage(req, res, i18nService, lang, i18nService.getMessage('loginFailed', lang));
    } catch (e) {
        logger.error(e);
        res.sendStatus(500);
    }
});

const renderLoginPage = (req: Request, res: Response, i18nService: MashroomI18NService, lang: string, error?: string) => {
    const csrfService: MashroomCSRFService = req.pluginContext.services.csrf?.service;
    const pathMapperService: MashroomVHostPathMapperService = req.pluginContext.services.vhostPathMapper?.service;
    const vhostMappingInfo = pathMapperService && pathMapperService.getMappingInfo(req);

    const queryParams: Array<string> = [];
    if (req.query) {
        for (const name in req.query) {
            if (req.query.hasOwnProperty(name) && name !== 'csrfToken') {
                const values = req.query[name];
                if (Array.isArray(values)) {
                    values.forEach((value: any) => queryParams.push(`${name}=${value}`));
                } else {
                    const value = values;
                    queryParams.push(`${name}=${value}`);
                }
            }
        }
    }

    let csrfToken = null;
    if (csrfService) {
        csrfToken = csrfService.getCSRFToken(req);
        queryParams.push(`csrfToken=${csrfToken}`);
    }

    const query = queryParams.join(('&'));

    res.render('login', {
        loginFormTitle: i18nService.translate(req, context.loginFormTitle),
        baseUrl: (vhostMappingInfo && vhostMappingInfo.frontendPath) || req.baseUrl,
        query,
        error,
        helpers: {
            '__': i18nHelper(i18nService, lang),
        },
    });
};

const redirect = (req: Request, res: Response) => {
    let redirectUrl = null;

    let query = req.query as any;
    if (req.method === 'POST' && req.headers.referer) {
        // Take the redirectUrl parameter from the referer
        const refererUrl = url.parse(req.headers.referer);
        query = refererUrl.query && querystring.parse(refererUrl.query);
    }
    if (query && query.redirectUrl) {
        const redirectParam = decodeURIComponent(query.redirectUrl);
        if (redirectParam.startsWith('/')) {
            redirectUrl = redirectParam;
        }
    }
    if (!redirectUrl) {
        redirectUrl = context.indexPage;
    }

    res.redirect(redirectUrl);
};

export default app;
