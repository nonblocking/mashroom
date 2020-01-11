// @flow

import {hasUnhandledRejection, hasUncaughtException} from '../../../GlobalNodeErrorHandler';

import type {ExpressRequest} from '../../../../../type-definitions';

export const up = (request: ExpressRequest): boolean => {
    return request.pluginContext && request.pluginContext.services && request.pluginContext.services.core.pluginService;
};

export const ready = (request: ExpressRequest): boolean => {
    if (!up(request)) {
        return false;
    }

    // All plugins loaded and ready
    return request.pluginContext.services.core.pluginService.getPlugins().every((plugin) => plugin.status === 'loaded');
};


export const healthy = (request: ExpressRequest): boolean => {
    if (!up(request)) {
        return false;
    }

    return !hasUncaughtException();
};
