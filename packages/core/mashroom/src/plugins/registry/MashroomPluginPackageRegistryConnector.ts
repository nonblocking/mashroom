
import {EventEmitter} from 'events';

import type {
    MashroomPluginPackageRegistryConnectorEventName, MashroomPluginPackageRegistryConnector as MashroomPluginPackageRegistryConnectorType,
} from '../../../type-definitions/internal';

export default class MashroomPluginPackageRegistryConnector implements MashroomPluginPackageRegistryConnectorType {

    _eventEmitter: EventEmitter;

    constructor() {
        this._eventEmitter = new EventEmitter();
    }

    on(eventName: MashroomPluginPackageRegistryConnectorEventName, listener: (arg: any) => void) {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginPackageRegistryConnectorEventName, listener: (arg: any) => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    emitUpdated() {
        this._eventEmitter.emit('updated');
    }

    emitRemoved() {
        this._eventEmitter.emit('removed');
    }

}
