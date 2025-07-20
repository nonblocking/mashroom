import React, {useEffect, useCallback, useContext} from 'react';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import { PORTAL_APP_CONTROLS_SETTINGS_KEY } from '../constants';
import {DependencyContext} from '../DependencyContext';
import {setShowPortalAppControls} from '../store/actions';
import type {State} from '../types';

export default () => {
    const {t} = useTranslation();
    const {portalAppControls} = useSelector((state: State) => state);
    const {portalAppManagementService} = useContext(DependencyContext);
    const dispatch = useDispatch();
    const setShowControls = (show: boolean) => dispatch(setShowPortalAppControls(show));

    const showControls = useCallback(() => {
        setShowControls(true);
        portalAppManagementService.showPortalAppControls();
        // global.localStorage can usually be replaced by just localStorage in browser environments
        localStorage.setItem(PORTAL_APP_CONTROLS_SETTINGS_KEY, 'true');
    }, []);

    const hideControls = useCallback(() => {
        setShowControls(false);
        portalAppManagementService.hidePortalAppControls();
        localStorage.setItem(PORTAL_APP_CONTROLS_SETTINGS_KEY, 'false');
    }, []);

    useEffect(() => {
        if (portalAppControls) {
            showControls();
        }
    }, []);

    const handleToggle = useCallback(() => {
        if (portalAppControls) {
            hideControls();
        } else {
            showControls();
        }
    }, [portalAppControls]);

    return (
        <div
            className={`portal-apps-control-toggle ${portalAppControls ? 'active' : ''}`}
            onClick={handleToggle}
            role="button"
            tabIndex={0}
        >
            <span>
                {t(portalAppControls ? 'hidePortalAppControls' : 'showPortalAppControls')}
            </span>
        </div>
    );
};
