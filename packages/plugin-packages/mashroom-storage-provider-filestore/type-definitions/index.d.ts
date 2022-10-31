
import type {MashroomStorageObject, MashroomStorageCollection, MashroomStorageRecord} from '@mashroom/mashroom-storage/type-definitions';

export type CollectionMap = {
    [name: string]: MashroomStorageCollection<any>;
}

export type JsonDB<T extends MashroomStorageRecord> = {
    d: Array<MashroomStorageObject<T>>;
}
