
export type Launch = {
    flight_number: string;
    mission_name: string;
    mission_id: string;
    rocket: {
        rocket_name: string;
    };
    launch_site: {
        site_name_long: string;
    };
    is_tentative: boolean;
    launch_year: string;
    launch_date_utc: string;
    launch_date_unix: number;
}

export type Launches = Array<Launch>;
