import {dirname, resolve, extname} from 'path';
import {existsSync, readFileSync} from 'fs';

type ModuleType = 'CJS' | 'ESM';

const findNearestPackageJson = (path: string): string | null => {
    let currentPath = path;
    while (currentPath) {
        const packageJsonPath = resolve(currentPath, 'package.json');
        if (existsSync(packageJsonPath)) {
            return packageJsonPath;
        }
        const parent = dirname(currentPath);
        if (parent !== currentPath) {
            currentPath = parent;
        } else {
            currentPath = '';
        }
    }

    return null;
};

export const detectModuleType = (path: string): ModuleType => {
    const packageJsonPath = findNearestPackageJson(path);
    if (packageJsonPath) {
        const { type } = JSON.parse(readFileSync(packageJsonPath,'utf-8'));
        if (type === 'module') {
            return 'ESM';
        }
    }

    // Default
    return 'CJS';
};

export const loadModule = async (modulePath: string) => {
    const ext = extname(modulePath).toLowerCase();

    let moduleType: ModuleType = 'CJS';
    if (ext === '.mjs' || ext === '.ts') {
        moduleType = 'ESM';
    } else if (modulePath.endsWith('.js')) {
        moduleType = detectModuleType(modulePath);
    }

    let module;
    if (moduleType === 'ESM') {
        module = await import(modulePath);
    } else {
        module = require(modulePath);
    }

    if ('default' in module) {
        return module.default;
    }
    return module;
};
