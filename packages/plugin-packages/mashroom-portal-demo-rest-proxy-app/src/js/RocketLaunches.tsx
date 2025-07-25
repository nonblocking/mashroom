import React, {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import fetchData from './fetch-data';
import type {RocketLaunchDotLiveLaunches} from './types';

type Props = {
    rocketLaunchApi: string;
}

const Launches = ({launches}: { launches: RocketLaunchDotLiveLaunches }) => {
    const {t} = useTranslation();

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
                    {t('provider')}
                </th>
                <th>
                    {t('missionName')}
                </th>
                <th>
                    {t('rocketName')}
                </th>
                <th>
                    {t('launchPad')}
                </th>
                <th>
                    {t('launchDate')}
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
    const {t} = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [launches, setLaunches] = useState<RocketLaunchDotLiveLaunches | null>(null);

    useEffect(() => {
        setLoading(true);
        fetchData(rocketLaunchApi).then(
            (response) => {
                setLoading(false);
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
                {t('loading')}
            </div>
        );
    } else if (error) {
        content = (
            <div className='error'>
                {t('errorLoading')}
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
                <h4>
                    {t('rocketLaunches')}
                </h4>
            </div>

            <div className="info">
                <span className="info-icon"/>
                {t('info')}
            </div>

            {content}
        </div>
    );
};
