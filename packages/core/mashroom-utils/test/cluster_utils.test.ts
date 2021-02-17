
import {isNodeCluster, getAllWorkerPids} from '../src/cluster_utils';

describe('cluster_utils.isNodeCluster', () => {

    it('returns false when no worker exists', () => {
        expect(isNodeCluster()).toBeFalsy();
    });

});


describe('cluster_utils.getAllWorkerPids', () => {

    it('returns a single pid when no cluster active', (done) => {
        getAllWorkerPids().then(
            (pids) => {
                expect(pids.length).toBeGreaterThan(0);
                done();
            }
        );
    });

});


