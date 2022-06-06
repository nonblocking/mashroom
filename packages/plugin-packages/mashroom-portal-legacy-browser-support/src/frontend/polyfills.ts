
// Polyfills for IE11

import 'core-js/es/object';
import 'core-js/es/symbol';
import 'core-js/es/array';
import 'core-js/es/string';
import 'core-js/es/math';
import 'core-js/es/promise';

// Fetch
import 'whatwg-fetch';

// Polyfill for document.currentScript lazy loading via webpack 5 automatic public path
// See https://webpack.js.org/guides/public-path/
import 'current-script-polyfill';

(global as any).crypto = global.crypto || (global as any).msCrypto;
