// @flow

import type {MashroomLogger as MashroomLoggerType, MashroomLoggerDelegate} from '../../type-definitions';

export default class MashroomLogger implements MashroomLoggerType {

    _category: string;
    _context: ?{};
    _delegate: MashroomLoggerDelegate;

    constructor(category: string, context: ?{}, delegate: MashroomLoggerDelegate) {
        this._category = category;
        this._context = context;
        this._delegate = delegate;
    }

    debug(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'debug', this._context, msg, args);
    }

    info(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'info', this._context, msg, args);
    }

    warn(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'warn', this._context, msg, args);
    }

    error(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'error', this._context, msg, args);
    }

    withContext(context: {}) {
        const mergedContext = Object.assign({}, this._context || {}, context);
        return new MashroomLogger(this._category, mergedContext, this._delegate);
    }

}

