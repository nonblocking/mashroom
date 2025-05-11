
import React, {useCallback, useContext, useRef, useState} from 'react';
import {DropdownMenu} from '@mashroom/mashroom-portal-ui-commons';
import {useIntl} from 'react-intl';
import {DependencyContext} from '../DependencyContext';
import AvailableAppsPanel from './AvailableAppsPanel';

import type {DragEvent} from 'react';

export default () => {
    const [filter, setFilter] = useState<string | undefined | null>(null);
    const closeRef = useRef <(() => void) | undefined>(undefined);
    const inputElemRef = useRef<HTMLInputElement | null>(null);
    const intl = useIntl();
    const {dataLoadingService, portalAppManagementService} = useContext(DependencyContext);

    const onOpen = useCallback(() => {
        dataLoadingService.loadAvailableApps(true);
        setFilter(null);
        setTimeout(() => {
            inputElemRef.current?.focus();
        }, 0);
    }, [dataLoadingService]);

    const onCloseRefCallback = useCallback((close: () => void) => {
        closeRef.current = close;
    }, []);

    const onAppDragStart = useCallback((event: DragEvent, name: string) => {
        portalAppManagementService.prepareDrag(event as any, null, name);
        closeRef.current?.();
    }, []);

    const onAppDragEnd = useCallback(() => {
        portalAppManagementService.dragEnd();
    }, []);

    const onFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setFilter(event.target.value);
    }, []);

    const filterLabel = intl.formatMessage({ id: 'filter' });

    return (
        <DropdownMenu
            className='add-app-dropdown-menu'
            labelId='addApp'
            onOpen={onOpen}
            closeRef={onCloseRefCallback}
        >
            <div className='add-app-content'>
                <input
                    type='search'
                    placeholder={filterLabel}
                    value={filter || ''}
                    onChange={onFilterChange}
                    ref={inputElemRef}
                />
                <div className='app-list'>
                    <AvailableAppsPanel
                        onDragStart={onAppDragStart}
                        onDragEnd={onAppDragEnd}
                        filter={filter}
                    />
                </div>
            </div>
        </DropdownMenu>
    );
};
