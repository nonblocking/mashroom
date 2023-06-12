import React, {useState, useEffect} from 'react';
import {FormattedMessage} from 'react-intl';
import fetchData from './fetch_data';
import type {RocketLaunchDotLiveLaunches} from './types';

type Props = {
    rocketLaunchApi: string;
}

const Launches = ({launches}: { launches: RocketLaunchDotLiveLaunches }) => {
    const rows = launches.map(({name, provider, vehicle, pad, t0}) => (
        <tr key={name}>
            <td>{provider.name}</td>
            <td>{name}</td>
            <td>{vehicle.name}</td>
            <td>{pad.location.name}</td>
            <td>{t0 ? new Date(t0).toLocaleDateString() : '?'}</td>
        </tr>
    ));

    return (
        <table className='table-striped'>
            <thead>
            <tr>
                <th>
                    <FormattedMessage id='provider'/>
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
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
    );
};

export default ({rocketLaunchApi}: Props) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [launches, setLaunches] = useState<RocketLaunchDotLiveLaunches | null>(null);

    useEffect(() => {
        setLoading(true);
        fetchData(rocketLaunchApi).then(
            (response) => {
                setLoading(false);
                console.info('!!!!', response);
                setLaunches(response.result);
            },
            (error) => {
                console.error('Fetching failed!', error);
                setLoading(false);
                setError(true);
            }
        );
    }, []);

    let content;
    if (loading) {
        content = (
            <div className='loading'>
                <FormattedMessage id='loading'/>
            </div>
        );
    } else if (error) {
        content = (
            <div className='error'>
                <FormattedMessage id='errorLoading'/>
            </div>
        );
    } else if (!launches) {
        content = null;
    } else {
        content = <Launches launches={launches}/>;
    }

    return (
        <div className='spacex-launches'>
            <div className='header'>
                <h4><FormattedMessage id='rocketLaunches'/></h4>
            </div>

            <div className="info">
                <span className="info-icon"/>
                <FormattedMessage id='info'/>
            </div>

            {content}
        </div>
    );
};
