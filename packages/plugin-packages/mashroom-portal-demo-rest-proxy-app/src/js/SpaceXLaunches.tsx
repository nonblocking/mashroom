
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import type {Launches} from './types';

type Props = {
    spaceXApiPath: string;
}

type State = {
    loading: boolean;
    errorLoading: boolean;
    launches: Launches;
}

export default class SpaceXLaunches extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            loading: false,
            errorLoading: false,
            launches: [],
        };
    }

    componentDidMount() {
        this.setState({
            loading: true,
        });
        fetch(`${this.props.spaceXApiPath}/launches/upcoming`, { credentials: 'same-origin' }).then(
            (response) => {
               response.json().then(
                   (launches) => {
                       this.setState({
                           loading: false,
                           launches,
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
        if (this.state.loading) {
            return (
                <div className='loading'>
                    <FormattedMessage id='loading'/>
                </div>
            );
        } else if (this.state.errorLoading) {
            return (
                <div className='error'>
                    <FormattedMessage id='errorLoading'/>
                </div>
            );
        }

        if (!this.state.launches) {
            return null;
        }

        const rows = this.state.launches.splice(0, 10).map((launch) => (
            <tr key={launch.flight_number}>
                <td>{launch.flight_number}</td>
                <td>{launch.mission_name}</td>
                <td>{launch.rocket.rocket_name}</td>
                <td>{launch.launch_site.site_name_long}</td>
                <td>{new Date(launch.launch_date_unix * 1000).toLocaleDateString()}</td>
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
                        <FormattedMessage id='siteName'/>
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
