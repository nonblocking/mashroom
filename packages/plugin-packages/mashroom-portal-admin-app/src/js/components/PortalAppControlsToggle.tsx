
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
        if (this.props.portalAppControls) {
            this.showPortalAppControls();
        }
    }

    showPortalAppControls() {
        this.props.setShowPortalAppControls(true);
        this.props.portalAppManagementService.showPortalAppControls();
        global.localStorage.setItem(PORTAL_APP_CONTROLS_SETTINGS_KEY, 'true');
    }

    hidePortalAppControls() {
        this.props.setShowPortalAppControls(false);
        this.props.portalAppManagementService.hidePortalAppControls();
        global.localStorage.setItem(PORTAL_APP_CONTROLS_SETTINGS_KEY, 'true');
    }

    toggle() {
        if (this.props.portalAppControls) {
            this.hidePortalAppControls();
        } else {
            this.showPortalAppControls();
        }
    }

    render() {
        return (
           <div className={`portal-apps-control-toggle ${this.props.portalAppControls ? 'active' : ''}`} onClick={this.toggle.bind(this)}>
                <span><FormattedMessage id='portalAppControls'/></span>
           </div>
        );
    }
}
