
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import fetchData from './fetch_data';
import type {Launches, Launchpads, Rockets} from './types';

type Props = {
    spaceXApiPath: string;
}

type State = {
    loading: boolean;
    errorLoading: boolean;
    launches: Launches;
    launchpads: Launchpads;
    rockets: Rockets;
}

export default class SpaceXLaunches extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            errorLoading: false,
            launches: [],
            launchpads: [],
            rockets: [],
        };
    }

    componentDidMount() {
        const {spaceXApiPath} = this.props;
        this.setState({
            loading: true,
        });
        fetchData(spaceXApiPath).then(
            ([launches, launchpads, rockets]) => {
                this.setState({
                    loading: false,
                    launches,
                    launchpads,
                    rockets,
                });
            },
            (error) => {
                console.error('Fetching failed!', error);
                this.setState({
                    loading: false,
                    errorLoading: true,
                });
            }
        );
    }

    renderContent() {
        const {loading, errorLoading, launches, launchpads, rockets} = this.state;
        if (loading) {
            return (
                <div className='loading'>
                    <FormattedMessage id='loading'/>
                </div>
            );
        } else if (errorLoading) {
            return (
                <div className='error'>
                    <FormattedMessage id='errorLoading'/>
                </div>
            );
        }

        if (!launches) {
            return null;
        }

        const nextTenLaunches = launches.sort((l1, l2) => l1.date_unix - l2.date_unix).splice(0, 10);

        const rows = nextTenLaunches.map(({name, flight_number, date_unix, rocket, launchpad}) => (
            <tr key={name}>
                <td>{flight_number}</td>
                <td>{name}</td>
                <td>{rockets.find((r) => r.id === rocket)?.name}</td>
                <td>{launchpads.find((l) => l.id === launchpad)?.full_name}</td>
                <td>{new Date(date_unix * 1000).toLocaleDateString()}</td>
            </tr>
        ));

        return (
            <table>
                <tr>
                    <th>
                        <FormattedMessage id='flightNumber'/>
                    </th>
                    <th>
                        <FormattedMessage id='missionName'/>
                    </th>
                    <th>
                        <FormattedMessage id='rocketName'/>
                    </th>
                    <th>
                        <FormattedMessage id='launchPad'/>
                    </th>
                    <th>
                        <FormattedMessage id='launchDate'/>
                    </th>
                </tr>
                {rows}
            </table>
        );
    }

    render() {
        return (
            <div className='spacex-launches'>
                <div className='header'>
                    <h4><FormattedMessage id='rocketLaunches'/></h4>
                </div>

                {this.renderContent()}
            </div>
        );
    }

}
