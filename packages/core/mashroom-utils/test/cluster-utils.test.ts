
import {isNodeCluster, getAllWorkerPids} from '../src/cluster-utils';

describe('cluster_utils.isNodeCluster', () => {

    it('returns false when no worker exists', () => {
        expect(isNodeCluster()).toBeFalsy();
    });

});


describe('cluster_utils.getAllWorkerPids', () => {

    it('returns a single pid when no cluster active', (done) => {
        if (process.env.GITHUB_WORKFLOW === 'Mashroom Run Tests Windows') {
            // TODO: find out why it doesn't work on windows server while it works on a local windows
            done();
        } else {
            getAllWorkerPids().then(
                (pids) => {
                    expect(pids.length).toBeGreaterThan(0);
                    done();
                }
            );
        }
    });

});


