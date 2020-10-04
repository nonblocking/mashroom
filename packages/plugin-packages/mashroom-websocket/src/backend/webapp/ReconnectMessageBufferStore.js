// @flow
import fs from 'fs';
import path from 'path';
import type { MashroomLogger } from '@mashroom/mashroom/type-definitions';
import type { MashroomLoggerFactory } from '@mashroom/mashroom/type-definitions';

export default class reconnectMessageBufferStore {
    _basePath: ?string;
    _logger: MashroomLogger;

    constructor(basePath: ?string, loggerFactory: MashroomLoggerFactory) {
        this._basePath = basePath;
        this._logger = loggerFactory('mashroom.websocket.server.reconnect.buffer');

        this._logger.debug(this._basePath
            ? `ReconnectMessageBufferStore is active. Storage path: ${basePath || ''}`
            : 'ReconnectMessageBufferStore is not active'
        );
    }

    get enabled() {
        return !!this._basePath;
    }

    async removeFile(name: string): Promise<void> {
        if (!this._basePath) {
            return Promise.resolve();
        }

        return new Promise<void>((res) => {
            fs.unlink(path.resolve(this._basePath || '', `${name}.json`), err => {
                if (err) {
                    this._logger.warn(`Temporary store file could not be deleted: ${err.toString()}`);
                    return res();
                }

                return res();
            });
        })
    }

    async appendData(name: string, data: string): Promise<void> {
        if (!this._basePath) {
            return Promise.resolve();
        }

        return new Promise<void>((res) => {
            fs.appendFile(path.resolve(this._basePath || '', `${name}.json`), `${data}\n`, err => {
                if (err) {
                    this._logger.warn(`Cannot append data to temporary store file: ${err.toString()}`);
                    return res();
                }

                return res();
            })
        })
    }

    async getData(name: string): Promise<string[]> {
        if (!this._basePath) {
            return Promise.resolve([]);
        }

        return new Promise((res) => {
            fs.readFile(path.resolve(this._basePath || '', `${name}.json`), (err, data) => {
                if (err) {
                    this._logger.warn(`Could not get data from temporary store file: ${err.toString()}`);
                    return res([]);
                }

                res((data.toString() || '').split('\n').filter(s => !!s));
            });
        });
    }
}
