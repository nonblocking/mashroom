
import {hasUncaughtException} from '../../../GlobalNodeErrorHandler';

import type {Request} from 'express';

export const up = (request: Request): boolean => {
    return !!request.pluginContext && !!request.pluginContext.services && !!request.pluginContext.services.core.pluginService;
};

export const ready = (request: Request): boolean => {
    if (!up(request)) {
        return false;
    }

    // All plugins loaded and ready
    return request.pluginContext.services.core.pluginService.getPlugins().every((plugin) => plugin.status === 'loaded');
};


export const healthy = (request: Request): boolean => {
    if (!up(request)) {
        return false;
    }

    return !hasUncaughtException();
};
