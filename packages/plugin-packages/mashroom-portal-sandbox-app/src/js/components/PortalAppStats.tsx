import React, {useCallback, useEffect, useState} from 'react';
import {FormattedMessage} from 'react-intl';
import memoryUsage from '../memory-usage';
import type {MashroomPortalAppService} from '@mashroom/mashroom-portal/type-definitions';
import type {ActivePortalApp} from '../types';

type Props = {
    activePortalApp: ActivePortalApp | undefined | null;
    portalAppService: MashroomPortalAppService;
}

export default ({activePortalApp, portalAppService}: Props) => {
    const [appStats, setAppStats] = useState('');
    const [memoryStats, setMemoryStats] = useState('');

    const updateStats = useCallback(() => {
        if (activePortalApp) {
            const stats = portalAppService.getAppStats(activePortalApp.appName);
            if (stats) {
                setAppStats(`${stats.resources} ${stats.resources > 1 ? 'files' : 'file'}${stats.totalSizeHumanReadable ? `, ${stats.totalSizeHumanReadable}` : ''}`);
            }
            memoryUsage().then((heapSize) => {
                if (heapSize) {
                    setMemoryStats(`${Math.round(heapSize / 1024 / 1024)} MB`);
                }
            });
        }
    }, [activePortalApp]);
    useEffect(() => {
        updateStats();
        const interval = setInterval(() => {
            updateStats();
        }, 1000);
        return () => clearInterval(interval);
    }, [updateStats]);

    if (!activePortalApp) {
        return null;
    }

    return (
        <div className='mashroom-sandbox-app-stats'>
            <FormattedMessage id='loadedResources' />
            {': '}
            {appStats}
            {memoryStats && (
                <>
                    <span className='spacer' />
                    <FormattedMessage id='pageMemoryUsage' />
                    {': '}
                    {memoryStats}
                </>
            )}
        </div>
    );
};
