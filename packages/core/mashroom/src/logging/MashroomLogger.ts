
import GlobalLoggerContext from './context/GlobalLoggerContext';

import type {
    MashroomLogger as MashroomLoggerType,
    MashroomLoggerContext,
} from '../../type-definitions';
import type {
    MashroomLoggerDelegate,
} from '../../type-definitions/internal';

export default class MashroomLogger implements MashroomLoggerType {

    private _category: string;
    private _context: MashroomLoggerContext | undefined | null;
    private _delegate: MashroomLoggerDelegate;

    constructor(category: string, context: MashroomLoggerContext | undefined | null, delegate: MashroomLoggerDelegate) {
        this._category = category;
        this._context = context;
        this._delegate = delegate;
    }

    debug(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'debug', this._context && this._context.get(), msg, args);
    }

    info(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'info', this._context && this._context.get(), msg, args);
    }

    warn(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'warn', this._context && this._context.get(), msg, args);
    }

    error(msg: string, ...args: any[]) {
        this._delegate.log(this._category, 'error', this._context && this._context.get(), msg, args);
    }

    addContext(context: any) {
        if (!this._context) {
            throw new Error('No logger context present. Please create a context logger with withContext()');
        }
        this._context.add(context);
    }

    withContext(context: any) {
        if (!this._context) {
            return new MashroomLogger(this._category, new GlobalLoggerContext(context), this._delegate);
        }
        const cloneContext = this._context.clone();
        cloneContext.add(context);
        return new MashroomLogger(this._category, cloneContext, this._delegate);
    }

    getContext() {
        return this._context ? this._context.get() : {};
    }
}
