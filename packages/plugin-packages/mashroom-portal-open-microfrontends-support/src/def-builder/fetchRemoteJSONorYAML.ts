import {configFileUtils} from '@mashroom/mashroom-utils';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';

const REMOTE_DEFAULT_SOCKET_TIMEOUT_MS = 5 * 1000;

export default async (url: URL, logger: MashroomLogger): Promise<any> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(),  REMOTE_DEFAULT_SOCKET_TIMEOUT_MS);
    try {
        const result = await fetch(url.toString(), {
            signal: controller.signal,
        });
        if (result.ok) {
            const text = await result.text();
            if (url.pathname.endsWith('.json')) {
                return JSON.parse(text);
            }
            return configFileUtils.fromYaml(text);
        } else if (result.status === 404) {
            logger.debug(`Not found: ${url}`);
            return null;
        } else {
            throw new Error(`Status code ${result.status}`);
        }
    } catch (e: any) {
        if (e.message.includes('aborted')) {
            logger.error(`Fetching from ${url} failed! Timed out after ${REMOTE_DEFAULT_SOCKET_TIMEOUT_MS}sec`);
        } else {
            logger.error(`Fetching from ${url} failed!`, e);
        }
    } finally {
        clearTimeout(timeout);
    }
    return null;
};
