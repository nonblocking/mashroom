
import {isNodeCluster, getAllWorkerPids} from '../src/cluster-utils';

jest.setTimeout(10000);

describe('cluster-utils.isNodeCluster', () => {

    it('returns false when no worker exists', () => {
        expect(isNodeCluster()).toBeFalsy();
    });

});

describe('cluster-utils.getAllWorkerPids', () => {

    it('returns a single pid when no cluster active', async () => {
        if (process.env.GITHUB_WORKFLOW === 'Unit Tests Windows') {
            // TODO: find out why it doesn't work on windows server while it works on a local windows
            return;
        }

        const pids = await getAllWorkerPids();
        expect(pids.length).toBeGreaterThan(0);
    });

});
