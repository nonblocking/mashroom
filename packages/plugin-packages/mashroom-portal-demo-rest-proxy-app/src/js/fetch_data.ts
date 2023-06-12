import type {RocketLaunchDotLiveResponse} from './types';

export default (rocketLaunchApiPath: string): Promise<RocketLaunchDotLiveResponse> => {
    return fetch(`${rocketLaunchApiPath}/launches/next/5`).then((resp) => resp.json());
};
