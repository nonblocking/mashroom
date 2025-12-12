import tsBlankSpace from 'ts-blank-space';

// Similar to https://github.com/bloomberg/ts-blank-space/blob/main/loader/hooks.js but
// supports a query part in the URL for cache busting

export async function resolve(specifier, context, nextResolve) {
    try {
        return await nextResolve(specifier, context);
    } catch (err) {
        if (err.url) {
            const [url, query = ''] = err.url.split('?');
            if (url.endsWith('.js')) {
                return nextResolve(`${url.slice(0, -'.js'.length)}.ts${query ? `?${query}` : ''}`);
            }
        }
        throw err;
    }
}

export async function load(url, context, nextLoad) {
    if (!url.split('?')[0].endsWith('.ts')) {
        return nextLoad(url, context);
    }

    const format = 'module';
    const result = await nextLoad(url, { ...context, format });
    const transformedSource = tsBlankSpace(result.source.toString());

    return {
        format,
        shortCircuit: true,
        source: `${transformedSource}\n//# sourceURL=${url}`,
    };
}
