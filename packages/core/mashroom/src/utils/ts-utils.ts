import {resolve} from 'path';
import {mkdtempSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';

let tsSupport = false;

const testTsSupport = async (): Promise<boolean> => {
    // Try load fake ts file
    try {
        const testFile = resolve(mkdtempSync(tmpdir()), 'test.ts');
        writeFileSync(testFile, 'type T = {};');
        await import(testFile);
        return true;
    } catch (e: any) {
        if (e.code !== 'ERR_UNKNOWN_FILE_EXTENSION') {
            // Some other problem
            return true;
        }
    }
    return false;
};

export const installTsBlankSpaceIfNecssary = async () => {
    if (tsSupport) {
        return;
    }

    if (await testTsSupport()) {
        tsSupport = true;
        return;
    }

    try {
        // @ts-ignore
        await import('../hooks/tsHooksRegister.mjs');
        console.info('Installed ts-blank-space to support TypeScript config files. See https://github.com/bloomberg/ts-blank-space/blob/main/docs/unsupported_syntax.md for limitations');
        tsSupport = true;
    } catch (e) {
        console.error('Failed to install ts-blank-space', e);
    }
};
