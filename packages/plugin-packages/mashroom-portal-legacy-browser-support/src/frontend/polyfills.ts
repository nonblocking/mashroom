
// Polyfills for IE11

import 'core-js/es/object';
import 'core-js/es/symbol';
import 'core-js/es/array';
import 'core-js/es/string';
import 'core-js/es/math';
import 'core-js/es/promise';
import 'whatwg-fetch';

(global as any).crypto = global.crypto || (global as any).msCrypto;
