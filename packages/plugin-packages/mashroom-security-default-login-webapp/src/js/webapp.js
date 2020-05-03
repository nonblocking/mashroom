// @flow

import path from 'path';
import express from 'express';
import exphbs from 'express-handlebars';
import bodyParser from 'body-parser';
import helpers, {i18nHelper} from './handlebar_helpers';
import context from './context';

import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomCSRFService} from '@mashroom/mashroom-csrf-protection/type-definitions';
import type {MashroomVHostPathMapperService} from '@mashroom/mashroom-vhost-path-mapper/type-definitions';

const app = express<ExpressRequest, ExpressResponse>();

app.use(bodyParser.urlencoded({
    extended: true,
}));

app.engine('handlebars', exphbs({
    helpers,
    defaultLayout: '',
}));
app.set('view engine', 'handlebars');
app.set('views', path.resolve(__dirname, '../views'));

app.get('/', async (req: ExpressRequest, res: ExpressResponse) => {
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

app.get('/style.css', (req: ExpressRequest, res: ExpressResponse) => {
    res.sendFile(context.styleFile);
});

app.post('/', async (req: ExpressRequest, res: ExpressResponse) => {
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

        const username = req.body._username;
        const password = req.body._password;

        logger.debug('Processing login attempt. Username: ', username);

        const result = await securityService.login(req, username, password);
        if (result.success) {
            redirect(req, res);
            return;
        }

        logger.warn('Login failed for user: ', username);

        renderLoginPage(req, res, i18nService, lang, i18nService.getMessage('loginFailed', lang));
    } catch (e) {
        logger.error(e);
        res.sendStatus(500);
    }
});

const renderLoginPage = (req: ExpressRequest, res: ExpressResponse, i18nService: MashroomI18NService, lang: string, error?: string) => {
    const csrfService: MashroomCSRFService = req.pluginContext.services.csrf && req.pluginContext.services.csrf.service;
    const pathMapperService: MashroomVHostPathMapperService = req.pluginContext.services.vhostPathMapper && req.pluginContext.services.vhostPathMapper.service;
    const vhostMappingInfo = pathMapperService && pathMapperService.getMappingInfo(req);

    const queryParams: Array<string> = [];
    if (req.query) {
        for (const name in req.query) {
            if (req.query.hasOwnProperty(name) && name !== 'csrfToken') {
                const values = req.query[name];
                if (Array.isArray(values)) {
                    values.forEach((value) => queryParams.push(`${name}=${value}`));
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

const redirect = (req: ExpressRequest, res: ExpressResponse) => {
    let redirectUrl = null;
    if (req.query.redirectUrl) {
        const redirectParam = decodeURIComponent(req.query.redirectUrl);
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
