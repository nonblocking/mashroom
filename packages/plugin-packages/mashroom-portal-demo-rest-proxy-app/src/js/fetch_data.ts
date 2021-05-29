import type {Launches, Launchpads, Rockets} from './types';

export default (spaceXApiPath: string): Promise<[Launches, Launchpads, Rockets]> => {
    return Promise.all([
        fetch(`${spaceXApiPath}/launches/upcoming`, { credentials: 'same-origin' }).then((resp) => resp.json()),
        fetch(`${spaceXApiPath}/launchpads`, { credentials: 'same-origin' }).then((resp) => resp.json()),
        fetch(`${spaceXApiPath}/rockets`, { credentials: 'same-origin' }).then((resp) => resp.json()),
    ])
}
