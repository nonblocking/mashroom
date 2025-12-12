import {extname} from 'path';
import {readFileSync} from 'fs';
import {parse as parseYaml} from 'yaml';
import {loadModule} from './module-utils';

export const fromYaml = (yaml: string): any => {
    return parseYaml(yaml);
};

export const loadConfigFile = async (filePath: string): Promise<any> => {
    const ext = extname(filePath).toLowerCase();

    if (ext == '.json') {
        return JSON.parse(readFileSync(filePath,'utf-8'));
    }
    if (ext == '.yaml' || ext == '.yml') {
        return fromYaml(readFileSync(filePath,'utf-8'));
    }

    return loadModule(filePath);
};
