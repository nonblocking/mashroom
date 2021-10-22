
import type {StorageObject, MashroomStorageCollection} from '@mashroom/mashroom-storage/type-definitions';

export type CollectionMap = {
    [name: string]: MashroomStorageCollection<any>;
}

export type JsonDB<T> = {
    d: Array<StorageObject<T>>;
}
