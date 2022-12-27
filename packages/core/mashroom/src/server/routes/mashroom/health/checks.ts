
import {hasUncaughtExceptions} from '../../../GlobalNodeErrorHandler';

import type {Request} from 'express';

type CheckResult = {
    ok: boolean;
    errors?: Array<string>;
};

export const up = (request: Request): boolean => {
    return !!request.pluginContext?.services?.core?.pluginService;
};

export const ready = async (request: Request): Promise<CheckResult> => {
    if (!up(request)) {
        return {
            ok: false,
            errors: ['Server not up yet'],
        };
    }

    const {pluginContext: {services: { core: {pluginService, healthProbeService} }, loggerFactory}} = request;
    let ok = true;
    const errors = [];

    // All plugins loaded and ready
    const allPluginPackagesBuild = pluginService.getPluginPackages().every((pluginPackage) => pluginPackage.status === 'ready');
    const allPluginsLoaded = pluginService.getPlugins().every((plugin) => plugin.status === 'loaded');
    if (!allPluginPackagesBuild || !allPluginsLoaded) {
        ok = false;
        errors.push('Not all plugins loaded');
    }

    // Check health probes
    const probes = healthProbeService.getProbes();
    for (let i = 0; i < probes.length; i++) {
        try {
            const result = await probes[i].check();
            if (!result.ready) {
                ok = false;
                result.error && errors.push(result.error);
            }
        } catch (e) {
            const logger = loggerFactory('mashroom.health');
            logger.error('Health probe failed', e);
        }
    }

    if (!ok) {
        return {
            ok: false,
            errors,
        };
    }

    return {
        ok: true,
    };
};

export const healthy = async (request: Request): Promise<CheckResult> => {
    // If the healthy route is used as liveness probe on K8S, return false here will kill the Pod
    const healthy = !hasUncaughtExceptions();
    if (!healthy) {
        return {
            ok: false,
            errors: ['Uncaught Exceptions'],
        };
    }

    return {
        ok: true,
    };
};
