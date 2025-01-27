
import context from './context';

function equals(this: any, lvalue: any, rvalue: any, options: any): any {
    if (arguments.length < 3) {
        throw new Error('Handlebars Helper equal needs 2 parameters');
    }
    if (lvalue !== rvalue) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
}

function year(): string {
    return `<span>${new Date().getFullYear()}</span>`;
}

function darkMode(this: any): 'light' | 'dark' | 'auto' {
    if (context.darkMode === true || context.darkMode as any === 'true') {
        return 'dark';
    }
    if (context.darkMode === false || context.darkMode as any === 'false') {
        return 'light';
    }
    return 'auto';
}

export default {
    equals,
    year,
    darkMode,
};
