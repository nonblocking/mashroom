
import { existsSync, unlink, appendFile, readFile } from 'fs';
import { ensureDirSync } from 'fs-extra';
import { isAbsolute, resolve } from 'path';
import type { MashroomLogger } from '@mashroom/mashroom/type-definitions';
import type { MashroomLoggerFactory } from '@mashroom/mashroom/type-definitions';

export default class ReconnectMessageBufferStore {

    private _enabled: boolean;
    private logger: MashroomLogger;

    constructor(private reconnectMessageBufferFolder: string | undefined | null, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.websocket.server.reconnect.buffer');
        this._enabled = false;

        if (reconnectMessageBufferFolder) {
            if (!isAbsolute(reconnectMessageBufferFolder)) {
                this.reconnectMessageBufferFolder = resolve(serverRootFolder, reconnectMessageBufferFolder);
            } else {
                this.reconnectMessageBufferFolder = reconnectMessageBufferFolder;
            }

            try {
                ensureDirSync(this.reconnectMessageBufferFolder);
                if (this.reconnectMessageBufferFolder && existsSync(this.reconnectMessageBufferFolder)) {
                    this._enabled = true;
                }
            } catch (e) {
                this.logger.error('Creating message buffer folder failed!', e);
            }
        }

        this.logger.info(this._enabled
            ? `WebSocket reconnect message buffering is active. Storage path: ${reconnectMessageBufferFolder || ''}`
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
            unlink(resolve(this.reconnectMessageBufferFolder || '', `${name}.json`), err => {
                if (err) {
                    this.logger.debug(`Temporary store file could not be deleted: ${err.toString()}`);
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
            appendFile(resolve(this.reconnectMessageBufferFolder || '', `${name}.json`), `${data}\n`, err => {
                if (err) {
                    this.logger.warn(`Cannot append data to temporary store file: ${err.toString()}`);
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
            readFile(resolve(this.reconnectMessageBufferFolder || '', `${name}.json`), (err, data) => {
                if (err) {
                    this.logger.debug(`Could not get data from temporary store file: ${err.toString()}`);
                    return res([]);
                }

                res((data.toString() || '').split('\n').filter(s => !!s));
            });
        });
    }
}
