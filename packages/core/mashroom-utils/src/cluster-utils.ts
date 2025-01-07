
import cluster from 'cluster';
import findProcess from 'find-process';

export const isNodeCluster = (): boolean => {
    return (cluster.workers && Object.keys(cluster.workers).length > 0) || !!cluster.worker;
};

export const getWorkerId = (): string => {
    return process.env.NODE_APP_INSTANCE || (cluster.worker && String(cluster.worker.id)) || 'master';
};

export const getAllWorkerPids = async (): Promise<Array<number>> => {
    try {
        const [thisProcess] = await findProcess('pid', process.pid);
        if (!thisProcess || !thisProcess.ppid) {
            return [];
        }
        const workers = await findProcess('name', thisProcess.name);
        if (!workers) {
            return [];
        }
        return workers
            .filter((worker) => worker.ppid === thisProcess.ppid)
            .map((worker) => worker.pid);
    } catch {
        // Ignore error
        return [];
    }
};
