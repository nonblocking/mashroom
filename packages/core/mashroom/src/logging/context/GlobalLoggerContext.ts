
import type {MashroomLoggerContext} from '../../../type-definitions';

export default class GlobalLoggerContext implements MashroomLoggerContext {

    private _context: any;

    constructor(context?: any) {
        this._context = context || {};
    }

    add(context: any) {
        this._context = {...this._context, ...context};
    }

    get() {
        return this._context;
    }

    clone() {
        return new GlobalLoggerContext({...this._context});
    }
}
