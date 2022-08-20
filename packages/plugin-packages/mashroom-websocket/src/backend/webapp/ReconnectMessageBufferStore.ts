
import { existsSync, unlink, appendFile, readFile } from 'fs';
import { isAbsolute, resolve } from 'path';
import { ensureDirSync } from 'fs-extra';
import type { MashroomLogger , MashroomLoggerFactory } from '@mashroom/mashroom/type-definitions';

export default class ReconnectMessageBufferStore {

    private _enabled: boolean;
    private _logger: MashroomLogger;

    constructor(private _reconnectMessageBufferFolder: string | undefined | null, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.websocket.server.reconnect.buffer');
        this._enabled = false;

        if (_reconnectMessageBufferFolder) {
            if (!isAbsolute(_reconnectMessageBufferFolder)) {
                this._reconnectMessageBufferFolder = resolve(serverRootFolder, _reconnectMessageBufferFolder);
            } else {
                this._reconnectMessageBufferFolder = _reconnectMessageBufferFolder;
            }

            try {
                ensureDirSync(this._reconnectMessageBufferFolder);
                if (this._reconnectMessageBufferFolder && existsSync(this._reconnectMessageBufferFolder)) {
                    this._enabled = true;
                }
            } catch (e) {
                this._logger.error('Creating message buffer folder failed!', e);
            }
        }

        this._logger.info(this._enabled
            ? `WebSocket reconnect message buffering is active. Storage path: ${_reconnectMessageBufferFolder || ''}`
            : 'WebSocket reconnect message buffering is not active'
        );
    }

    get enabled(): boolean {
        return this._enabled;
    }

    async removeFile(name: string): Promise<void> {
        if (!this._enabled) {
            return Promise.resolve();
        }

        return new Promise<void>((res) => {
            unlink(resolve(this._reconnectMessageBufferFolder || '', `${name}.json`), err => {
                if (err) {
                    this._logger.debug(`Temporary store file could not be deleted: ${err.toString()}`);
                    return res();
                }

                return res();
            });
        });
    }

    async appendData(name: string, data: string): Promise<void> {
        if (!this._enabled) {
            return Promise.resolve();
        }

        return new Promise<void>((res) => {
            appendFile(resolve(this._reconnectMessageBufferFolder || '', `${name}.json`), `${data}\n`, err => {
                if (err) {
                    this._logger.warn(`Cannot append data to temporary store file: ${err.toString()}`);
                    return res();
                }

                return res();
            });
        });
    }

    async getData(name: string): Promise<string[]> {
        if (!this._enabled) {
            return Promise.resolve([]);
        }

        return new Promise((res) => {
            readFile(resolve(this._reconnectMessageBufferFolder || '', `${name}.json`), (err, data) => {
                if (err) {
                    this._logger.debug(`Could not get data from temporary store file: ${err.toString()}`);
                    return res([]);
                }

                res((data.toString() || '').split('\n').filter(s => !!s));
            });
        });
    }
}
