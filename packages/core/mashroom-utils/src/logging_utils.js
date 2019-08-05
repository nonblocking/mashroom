// @flow
/* eslint no-console: off */

import {determineUserAgent} from './user_agent_utils';

import type {$Request as Request} from 'express';

export const dummyLoggerFactory = () => {
    const dummyLogger = {
        debug: console.debug,
        info: console.debug,
        warn: console.debug,
        error: console.debug,
        withContext: () => dummyLogger
    };

    return dummyLogger;
};

export const userAndAgentContext = (req: Request) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const ua = determineUserAgent(req);

    let username = null;
    let mashroomServices = (req: any).pluginContext.services;
    let securityService = mashroomServices.security && mashroomServices.security.service;
    if (securityService) {
        const mashroomUser = securityService.getUser(req);
        if (mashroomUser) {
            username = mashroomUser.username
        }
    }

    return {
        clientIP,
        username,
        browser: ua.browser.name,
        browserVersion: ua.browser.version,
        os: ua.os.name
    };
};