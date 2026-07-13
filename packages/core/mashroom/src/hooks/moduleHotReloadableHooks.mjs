let _logMessagePort;

export async function initialize({ logMessagePort }) {
    _logMessagePort = logMessagePort;
}

export async function resolve(specifier, context, next) {
    const cleanSpecifier = specifier.split('?')[0];

    // Ignore modules within node_modules
    if (context.parentURL?.indexOf('/node_modules/') !== -1) {
        return next(specifier, context);
    }

    // We ignore specifiers like "express" which might not be ESM modules
    const esModule = ['.ts', '.mjs', '.js'].find((ext) => cleanSpecifier.endsWith(ext));
    if (!esModule) {
        return next(specifier, context);
    }

    // We reload the module any time, even if the file didn't change, because some sub-modules might have changed
    _logMessagePort.postMessage(`Hot ES module loading: ${cleanSpecifier}`);
    specifier = `${cleanSpecifier}?ts=${Date.now()}`;
    return await next(specifier, context);
}
