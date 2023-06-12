
export type RocketLaunchDotLiveResponse = {
    result: RocketLaunchDotLiveLaunches,
}

export type RocketLaunchDotLiveLaunch = {
    id: string;
    name: string;
    t0: string;
    provider: {
        name: string;
    };
    vehicle: {
        name: string;
    };
    pad: {
        name: string;
        location: {
            name: string;
        }
    };
    missions: Array<{
        name: string;
    }>;
}

export type RocketLaunchDotLiveLaunches = Array<RocketLaunchDotLiveLaunch>;
