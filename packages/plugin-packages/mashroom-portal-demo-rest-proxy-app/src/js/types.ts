
export type Launch = {
    flight_number: string;
    name: string;
    id: string;
    rocket: string;
    launchpad: string;
    upcoming: boolean;
    date_utc: string;
    date_unix: number;
}

export type Launches = Array<Launch>;

export type Launchpad = {
    id: string;
    full_name: string;
}

export type Launchpads = Array<Launchpad>;

export type Rocket = {
    id: string;
    name: string;
}

export type Rockets = Array<Rocket>;
