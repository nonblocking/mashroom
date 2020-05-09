
import type {StorageObject} from '@mashroom/mashroom-storage/type-definitions';
import {MashroomStorageCollection} from '@mashroom/mashroom-storage/type-definitions';

export type CollectionMap = {
    [name: string]: MashroomStorageCollection<any>;
}

export type JsonDB<T> = {
    d: Array<StorageObject<T>>;
}
