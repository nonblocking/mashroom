
import themeParams from './theme_params';

function equals(this: any, lvalue: any, rvalue: any, options: any): any {
    if (arguments.length < 3) {
        throw new Error('Handlebars Helper equal needs 2 parameters');
    }
    if (lvalue !== rvalue) {
        return options.inverse(this);
    }
    return options.fn(this);
}

function i18n(messages: (key: string) => string, key: string): string {
    return messages(key) || key;
}

function defaultPluginErrorMessage(pluginName: string, messages: (key: string) => string): string {
    const message = messages('portalAppLoadingFailed') || 'Portal app ${name} is temporarily not available';
    return message.replace('${name}', pluginName);
}

function env(): string {
    return process.env.NODE_ENV || 'development';
}

function ifSpaMode(this: any, options: any): any {
    if (!themeParams.spaMode) {
        return options.inverse(this);
    }
    return options.fn(this);
}

function mashroomVersion(): string {
    return themeParams.mashroomVersion;
}

function extraMainClasses(): string {
    let classes = '';
    if (themeParams.showPortalAppHeaders) {
        classes += 'show-portal-app-headers';
    }
    return classes;
}

function ifShowEnvAndVersions(this: any, options: any): any {
    if (themeParams.showEnvAndVersions) {
        return options.fn(this);
    }
    return null;
}

export default {
    equals,
    ifSpaMode,
    env,
    mashroomVersion,
    extraMainClasses,
    ifShowEnvAndVersions,
    '__': i18n,
    defaultPluginErrorMessage,
};
