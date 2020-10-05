// @flow

import {existsSync, unlink, appendFile, readFile} from 'fs';
import {ensureDirSync} from 'fs-extra';
import path from 'path';
import type { MashroomLogger } from '@mashroom/mashroom/type-definitions';
import type { MashroomLoggerFactory } from '@mashroom/mashroom/type-definitions';

export default class ReconnectMessageBufferStore {
    _enabled: boolean;
    _reconnectMessageBufferFolder: ?string;
    _logger: MashroomLogger;

    constructor(reconnectMessageBufferFolder: ?string, loggerFactory: MashroomLoggerFactory) {
        this._reconnectMessageBufferFolder = reconnectMessageBufferFolder;
        this._logger = loggerFactory('mashroom.websocket.server.reconnect.buffer');

        if (reconnectMessageBufferFolder) {
            try {
                ensureDirSync(reconnectMessageBufferFolder);
                if (existsSync(reconnectMessageBufferFolder)) {
                    this._enabled = true;
                }
            } catch (e) {
                this._logger.error('Creating message buffer folder failed!', e);
            }
        }

        this._logger.info(this._enabled
            ? `ReconnectMessageBufferStore is active. Storage path: ${reconnectMessageBufferFolder || ''}`
            : 'ReconnectMessageBufferStore is not active'
        );
    }

    get enabled() {
        return this._enabled;
    }

    async removeFile(name: string): Promise<void> {
        if (!this._enabled) {
            return Promise.resolve();
        }

        return new Promise<void>((res) => {
            unlink(path.resolve(this._reconnectMessageBufferFolder || '', `${name}.json`), err => {
                if (err) {
                    this._logger.warn(`Temporary store file could not be deleted: ${err.toString()}`);
                    return res();
                }

                return res();
            });
        })
    }

    async appendData(name: string, data: string): Promise<void> {
        if (!this._enabled) {
            return Promise.resolve();
        }

        return new Promise<void>((res) => {
            appendFile(path.resolve(this._reconnectMessageBufferFolder || '', `${name}.json`), `${data}\n`, err => {
                if (err) {
                    this._logger.warn(`Cannot append data to temporary store file: ${err.toString()}`);
                    return res();
                }

                return res();
            })
        })
    }

    async getData(name: string): Promise<string[]> {
        if (!this._enabled) {
            return Promise.resolve([]);
        }

        return new Promise((res) => {
            readFile(path.resolve(this._reconnectMessageBufferFolder || '', `${name}.json`), (err, data) => {
                if (err) {
                    this._logger.warn(`Could not get data from temporary store file: ${err.toString()}`);
                    return res([]);
                }

                res((data.toString() || '').split('\n').filter(s => !!s));
            });
        });
    }
}
