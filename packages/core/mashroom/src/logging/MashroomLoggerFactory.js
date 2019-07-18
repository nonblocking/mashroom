// @flow

import os from 'os';
import {isObject} from '@mashroom/mashroom-utils/lib/model_utils';

import type {MashroomLoggerDelegate, MashroomLoggerFactory as MashroomLoggerFactoryType, MashroomLogger} from '../../type-definitions';

const HOSTNAME = os.hostname() || 'localhost';
const PID = process.env.pm_id || process.pid;

/**
 * Logger factory implementation
 */
export default class MashroomLoggerFactory {

    _delegate: MashroomLoggerDelegate;

    constructor(delegate: MashroomLoggerDelegate) {
        this._delegate = delegate;
    }

    async factory(serverRootPath: string): Promise<MashroomLoggerFactoryType> {
        await this._delegate.init(serverRootPath);

        return (category: string, defaultContext?: {}): MashroomLogger => {
            if (!defaultContext) {
                defaultContext = {};
            }
            if (defaultContext && !isObject(defaultContext)) {
                defaultContext = {value: defaultContext};
            }

            return new MashroomLoggerImpl(category, defaultContext, null, this._delegate);
        }
    }

}

class MashroomLoggerImpl implements MashroomLogger {

    _category: string;
    _defaultContext: {};
    _context: ?{};
    _delegate: MashroomLoggerDelegate;

    constructor(category: string, defaultContext: {}, context: ?{}, delegate: MashroomLoggerDelegate) {
        this._category = category;
        this._defaultContext = defaultContext;
        this._context = context;
        this._delegate = delegate;
    }

    debug(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'debug', this._mergeContext(), msg, args);
    }

    info(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'info', this._mergeContext(), msg, args);
    }

    warn(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'warn', this._mergeContext(), msg, args);
    }

    error(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'error', this._mergeContext(), msg, args);
    }

    withContext(context: {}) {
        const mergedContext = Object.assign({}, this._context || {}, context);
        return new MashroomLoggerImpl(this._category, this._defaultContext, mergedContext, this._delegate);
    }

    _mergeContext() {
        let context = this._context;
        if (!context) {
            context = {};
        }

        if (context && !isObject(context)) {
            context = {value: context};
        }

        return Object.assign({}, {
            hostname: HOSTNAME,
            pid: PID
        }, this._defaultContext, context);
    }

}
