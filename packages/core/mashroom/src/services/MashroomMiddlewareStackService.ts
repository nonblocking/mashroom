
import type {Request, Response} from 'express';
import type {
    MashroomLogger, MashroomLoggerFactory,
    MashroomMiddlewareStackService as MashroomMiddlewareStackServiceType,
} from '../../type-definitions';
import type {
    MiddlewarePluginDelegate,
} from '../../type-definitions/internal';

const privatePropsMap: WeakMap<MashroomMiddlewareStackService, {
    readonly middlewarePluginDelegate: MiddlewarePluginDelegate;
}> = new WeakMap();

export default class MashroomMiddlewareStackService implements MashroomMiddlewareStackServiceType {

    private readonly _loggger: MashroomLogger;

    constructor(middlewarePluginDelegate: MiddlewarePluginDelegate, loggerFactory: MashroomLoggerFactory) {
        privatePropsMap.set(this, {
            middlewarePluginDelegate
        });
        this._loggger = loggerFactory('mashroom.middleware.service');
    }

    has(pluginName: string) {
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return !!privateProps.middlewarePluginDelegate.middlewareStack.find((me) => me.pluginName === pluginName);
        }
        return false;
    }

    async apply(pluginName: string, req: Request, res: Response) {
        const privateProps = privatePropsMap.get(this);
        const middlewareEntry = privateProps && privateProps.middlewarePluginDelegate.middlewareStack.find((me) => me.pluginName === pluginName);
        if (!middlewareEntry) {
            throw new Error(`No middleware plugin '${pluginName} found!`);
        }

        this._loggger.debug(`Applying middleware: ${pluginName}`);
        return new Promise<void>((resolve, reject) => {
            try {
                middlewareEntry.middleware(req, res, () => {
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    getStack(): Array<{ pluginName: string, order: number }> {
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return privateProps.middlewarePluginDelegate.middlewareStack.map((me) => ({
                pluginName: me.pluginName,
                order: me.order,
            }));
        }
        return [];
    }
}
