
import cluster from 'cluster';
import findProcess from 'find-process';

export const isNodeCluster = (): boolean => {
    return (cluster.workers && Object.keys(cluster.workers).length > 0) || !!cluster.worker;
};

export const getWorkerId = (): string => {
    return process.env.NODE_APP_INSTANCE || (cluster.worker && String(cluster.worker.id)) || 'master';
};

export const getAllWorkerPids = (): Promise<Array<number>> => {
    return findProcess('pid', process.pid).then(
        ([thisProcess]) => {
            if (!thisProcess || !thisProcess.ppid) {
                return [];
            }
            return findProcess('name', thisProcess.name).then(
                (workers) => {
                    if (!workers) {
                        return [];
                    }
                    return workers
                        .filter((worker) => worker.ppid === thisProcess.ppid)
                        .map((worker) => worker.pid);
                }
            );
        }
    ).catch(() => {
        // Ignore error
        return Promise.resolve([]);
    });
};
