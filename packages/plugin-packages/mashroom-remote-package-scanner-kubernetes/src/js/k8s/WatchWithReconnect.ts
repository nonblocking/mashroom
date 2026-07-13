import {Watch} from '@kubernetes/client-node';

import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {KubeConfig} from '@kubernetes/client-node';
import type {KUBERNETES_WATCH_EVENTS, KubernetesWatchCallback, KubernetesWatcher} from '../types';

export default class WatchWithReconnect {
    #watch: Watch;
    constructor(k8sClient: KubeConfig, private logger: MashroomLogger) {
        this.#watch = new Watch(k8sClient);
    }

    public async watch<T>(path: string, queryParams: Record<string, string | number | undefined>, cb: KubernetesWatchCallback<T>): Promise<KubernetesWatcher> {
        let aborted = false;
        let controller: AbortController | undefined;

        const startWatcher = async () => {
            this.logger.info('Adding K8S watcher for path: ', path);

            controller = await this.#watch.watch(path, queryParams, (phase, apiObj) => {
                cb(phase as KUBERNETES_WATCH_EVENTS, apiObj);
            }, (error) => {
                if (!error) {
                    this.logger.info(`K8S Watcher on ${path} lost connection`);
                } else {
                    this.logger.error(`K8S Watcher error on ${path}:`, error);
                }
                if (!aborted) {
                    this.logger.info(`Reconnecting K8S Watcher on ${path}...`);
                    setTimeout(() => {
                        startWatcher();
                    }, 1000);
                }
            });
        };

        await startWatcher();

        return {
            abort() {
                aborted = true;
                if (controller) {
                    controller.abort();
                }
            }
        };
    }
}
