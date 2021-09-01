import {nanoid} from 'nanoid';

export const createSiteId = (): string => nanoid(8);
export const createPageId = (): string => nanoid(8);
export const createAppInstanceId = (): string => nanoid(8);
export const createAppId = (): string => nanoid(8);
