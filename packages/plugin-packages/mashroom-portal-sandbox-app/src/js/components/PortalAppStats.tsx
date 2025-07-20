import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import memoryUsage from '../memory-usage';
import type {MashroomPortalAppService} from '@mashroom/mashroom-portal/type-definitions';
import type {State} from '../types';

type Props = {
    portalAppService: MashroomPortalAppService;
}

export default ({portalAppService}: Props) => {
    const {t} = useTranslation();
    const [appStats, setAppStats] = useState('');
    const [memoryStats, setMemoryStats] = useState('');
    const {activePortalApp} = useSelector((state: State) => state);

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
            {t('loadedResources')}
            {': '}
            {appStats}
            {memoryStats && (
                <>
                    <span className='spacer' />
                    {t('pageMemoryUsage')}
                    {': '}
                    {memoryStats}
                </>
            )}
        </div>
    );
};
