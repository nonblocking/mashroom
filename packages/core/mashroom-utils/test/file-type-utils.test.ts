
import {isES6Module, isChunkWithHash, isTypescript} from '../src/file-type-utils';

describe('file-type-utils.isES6Module', () => {

    it('detects ES6 modules based on the extension', () => {
        expect(isES6Module('foo/bar/index.js')).toBeFalsy();
        expect(isES6Module('foo/bar/index.mjs')).toBeTruthy();
        expect(isES6Module('foo/bar/x.mjs?x=1')).toBeTruthy();
    });

});

describe('file-type-utils.isTypescript', () => {

    it('detects typescript files based on the extension', () => {
        expect(isTypescript('foo/bar/index.js')).toBeFalsy();
        expect(isTypescript('foo/bar/index.ts')).toBeTruthy();
        expect(isTypescript('foo/bar/x.mts?x=1')).toBeTruthy();
    });

});

describe('file-type-utils.isChunkWithHash', () => {

    it('detects chunks with hashes based on the file name', () => {
        expect(isChunkWithHash('foo/bar/index.js')).toBeFalsy();
        expect(isChunkWithHash('foo/bar/101.bundle.js')).toBeFalsy();
        expect(isChunkWithHash('foo/bar/index.1690e0a8df1cf48ee13f.js')).toBeTruthy();
        expect(isChunkWithHash('foo/bar/x_56770a64.js')).toBeTruthy();
        expect(isChunkWithHash('foo/bar/x-foo-bar.js')).toBeFalsy();
        expect(isChunkWithHash('foo/bar/bundle[d2476a92db].js?foo=1')).toBeTruthy();
    });

});


