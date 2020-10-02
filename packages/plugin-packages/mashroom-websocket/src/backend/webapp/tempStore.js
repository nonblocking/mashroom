// @flow
import fs from 'fs';
import path from 'path';
import type { MashroomLogger } from '@mashroom/mashroom/type-definitions';

export default class TemporaryFileStore {
    _basePath: string;
    _logger: MashroomLogger;

    constructor(basePath: string, logger: MashroomLogger) {
        this._basePath = basePath;
        this._logger = logger;
    }

    async removeFile(name: string): Promise<void> {
        return new Promise<void>((res, rej) => {
            fs.unlink(path.resolve(this._basePath, `${name}.json`), err => {
                if (err) {
                    this._logger.warn(`Temporary store file could not be deleted: ${err.toString()}`);
                    return rej(err);
                }

                return res();
            });
        })
    }

    async appendData(name: string, data: string): Promise<void> {
        return new Promise<void>((res, rej) => {
            fs.appendFile(path.resolve(this._basePath, `${name}.json`), `${data}\n`, err => {
                if (err) {
                    this._logger.warn(`Cannot append data to temporary store file: ${err.toString()}`);
                    return rej(err);
                }

                return res();
            })
        })
    }

    async getData(name: string): Promise<string[]> {
        return new Promise((res) => {
            fs.readFile(path.resolve(this._basePath, `${name}.json`), (err, data) => {
                if (err) {
                    this._logger.warn(`Could not get data from temporary store file: ${err.toString()}`);
                    return res([]);
                }

                res((data.toString() || '').split('\n').filter(s => !!s));
            });
        });
    }
}
