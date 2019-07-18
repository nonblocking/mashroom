// @flow

import EventEmitter from 'events';

import type {
    MashroomPluginPackageRegistryConnectorEventName, MashroomPluginPackageRegistryConnector as MashroomPluginPackageRegistryConnectorType,
} from '../../../type-definitions';

export default class MashroomPluginPackageRegistryConnector implements MashroomPluginPackageRegistryConnectorType {

    _eventEmitter: EventEmitter;

    constructor() {
        this._eventEmitter = new EventEmitter();
    }

    on(eventName: MashroomPluginPackageRegistryConnectorEventName, listener: void => void) {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginPackageRegistryConnectorEventName, listener: void => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    emitUpdated() {
        this._eventEmitter.emit('updated');
    }

    emitRemoved() {
        this._eventEmitter.emit('removed');
    }

}
