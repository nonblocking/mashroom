
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import {PORTAL_APP_CONTROLS_SETTINGS_KEY} from '../constants';

import type {PortalAppManagementService} from '../types';

type Props = {
    portalAppControls: boolean,
    setShowPortalAppControls: (show: boolean) => void,
    portalAppManagementService: PortalAppManagementService,
};

export default class PortalAppControlsToggle extends PureComponent<Props> {

    componentDidMount() {
        const {portalAppControls} = this.props;
        if (portalAppControls) {
            this.showPortalAppControls();
        }
    }

    showPortalAppControls() {
        const {setShowPortalAppControls, portalAppManagementService} = this.props;
        setShowPortalAppControls(true);
        portalAppManagementService.showPortalAppControls();
        global.localStorage.setItem(PORTAL_APP_CONTROLS_SETTINGS_KEY, 'true');
    }

    hidePortalAppControls() {
        const {setShowPortalAppControls, portalAppManagementService} = this.props;
        setShowPortalAppControls(false);
        portalAppManagementService.hidePortalAppControls();
        global.localStorage.setItem(PORTAL_APP_CONTROLS_SETTINGS_KEY, 'false');
    }

    toggle() {
        const {portalAppControls} = this.props;
        if (portalAppControls) {
            this.hidePortalAppControls();
        } else {
            this.showPortalAppControls();
        }
    }

    render() {
        const {portalAppControls} = this.props;
        return (
           <div className={`portal-apps-control-toggle ${portalAppControls ? 'active' : ''}`} onClick={this.toggle.bind(this)}>
                <span><FormattedMessage id={portalAppControls ? 'hidePortalAppControls' : 'showPortalAppControls'} /></span>
           </div>
        );
    }
}
