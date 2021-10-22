
import type {MashroomStorageObject, MashroomStorageCollection} from '@mashroom/mashroom-storage/type-definitions';

export type CollectionMap = {
    [name: string]: MashroomStorageCollection<any>;
}

export type JsonDB<T> = {
    d: Array<MashroomStorageObject<T>>;
}
