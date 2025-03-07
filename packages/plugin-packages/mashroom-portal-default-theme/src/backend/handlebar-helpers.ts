
import {readFileSync} from 'fs';
import {resolve} from 'path';
import themeParams from './theme-params';

const packageJson = require('../package.json');

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

function darkMode(this: any): 'light' | 'dark' | 'auto' {
    if (themeParams.darkMode === true || themeParams.darkMode as any === 'true') {
        return 'dark';
    }
    if (themeParams.darkMode === false || themeParams.darkMode as any === 'false') {
        return 'light';
    }
    return 'auto';
}

function mashroomVersion(): string {
    return themeParams.mashroomVersion;
}

function fontawesomeVersion(): string {
    return packageJson.devDependencies['@fortawesome/fontawesome-free']?.replace(/[^]/, '');
}

function extraMainClasses(): string {
    let classes = '';
    if (themeParams.showPortalAppHeaders) {
        classes += 'show-portal-app-headers';
    }
    return classes;
}

function themeExtraStyle(): string {
    if (themeParams.styleFile) {
        return inlineStyle(themeParams.styleFile);
    }
    return '';
}

function inlineStyle(cssFile: string): string {
    try {
        const file = readFileSync(resolve(__dirname, 'public', cssFile));
        return `<style>${file.toString('utf-8')}</style>`;
    } catch (e) {
        return `<!-- Error: CSS file not found: ${cssFile} -->`;
    }
}

function logoImage(): string {
    if (!themeParams.logoImageUrl) {
        // Default logo
        const file = readFileSync(resolve(__dirname, 'public/assets', 'logo-white.svg'));
        return file.toString('utf-8');
    }

    return `
        <img src="${themeParams.logoImageUrl}" alt="Logo"/>
    `;
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
    darkMode,
    env,
    mashroomVersion,
    fontawesomeVersion,
    extraMainClasses,
    themeExtraStyle,
    inlineStyle,
    logoImage,
    ifShowEnvAndVersions,
    __: i18n,
    defaultPluginErrorMessage,
};
