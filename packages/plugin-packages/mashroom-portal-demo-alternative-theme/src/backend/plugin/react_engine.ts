import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {ExpressTemplateEngine} from '@mashroom/mashroom-portal/type-definitions';

const engine: ExpressTemplateEngine = (path, options, cb) => {
    let html;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const component = require(path).default;
        html = `<!DOCTYPE html>${renderToStaticMarkup(createElement(component, options))}`;
    } catch (e) {
        return cb(e);
    } finally {
        if (options.settings.env === 'development') {
            // Remove all files from the module cache that are in the view folder
            Object.keys(require.cache).forEach((module) => {
                if (require.cache[module]?.filename.startsWith(options.settings.views)) {
                    delete require.cache[module];
                }
            });
        }
    }

    cb(null, html);
};

export default engine;
