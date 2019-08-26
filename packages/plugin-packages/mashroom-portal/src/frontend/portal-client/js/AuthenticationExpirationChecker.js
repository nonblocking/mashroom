// @flow

import {
    WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION,
    WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION
} from '../../../backend/constants';

import type {MashroomPortalUserService} from '../../../../type-definitions';

const checkAuthenticationExpiration: boolean = global[WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION];
const autoExtendAuthentication: boolean = global[WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION];

const AUTH_EXPIRES_WARNING_PANEL_ID = 'mashroom-portal-auth-expires-warning';
const AUTH_EXPIRES_SECONDS_ELEM_ID = 'mashroom-portal-auth-expires-seconds';
const EXTEND_AUTHENTICATION_LINK_ID = 'mashroom-portal-auth-expires-extend';
const SHOW_WARNING_THRESHOLD_SEC = 30;

let extendAuthenticationLinkAttached = false;

export default class MashroomPortalUserInactivityHandler {

    _portalUserService: MashroomPortalUserService;
    _authenticationExpirationTime: ?number;
    _warningPanelVisible: boolean;

    constructor(portalUserService: MashroomPortalUserService) {
        this._portalUserService = portalUserService;
        this._authenticationExpirationTime = null;
        this._warningPanelVisible = false;
    }

    start() {
        if (!checkAuthenticationExpiration) {
            return;
        }

        console.info('Starting authentication expiration checker');
        this._startCheckTimer(30);
    }

    _startCheckTimer(timoutSec: number) {
        setTimeout(() => this._checkExpirationTime(), timoutSec * 1000);
    }

    _checkExpirationTime() {
        this._portalUserService.getAuthenticationExpiration().then(
            (expirationTime) => {
                this._authenticationExpirationTime = expirationTime;
                this._handleExpirationTimeUpdate();
            }
        );
    }

    _extendAuthentication() {
        this._portalUserService.extendAuthentication();
    }

    _handleExpirationTimeUpdate() {
        const timeLeft = this._getTimeLeftSec();
        console.debug(`Authentication expires in ${timeLeft}sec`);

        if (timeLeft <= 0) {
            this._logout();
            this._hideWarningPanel();
        } else if (timeLeft <= SHOW_WARNING_THRESHOLD_SEC) {
            if (autoExtendAuthentication) {
                console.info('Auto extending authentication');
                this._extendAuthentication();
            } else {
                this._showTimeLeft();
            }
            this._startCheckTimer(1);
        } else {
            this._hideWarningPanel();
            const nextCheck = Math.max(10, timeLeft - 60);
            this._startCheckTimer(nextCheck);
        }
    }

    _getTimeLeftSec() {
        if (this._authenticationExpirationTime) {
            return Math.trunc((this._authenticationExpirationTime - Date.now()) / 1000);
        }
        return -1;
    }

    _showTimeLeft() {
        this._showWarningPanel();

        const secondsElem = document.getElementById(AUTH_EXPIRES_SECONDS_ELEM_ID);
        if (secondsElem) {
            const timeLeft = this._getTimeLeftSec();
            let seconds = String(timeLeft);
            if (timeLeft < 10) {
                seconds = '0' + seconds;
            }
            secondsElem.innerHTML = seconds;
        } else {
            console.error(`No element with id ${AUTH_EXPIRES_SECONDS_ELEM_ID} found! Cannot display seconds until logout.`);
        }
    }

    _showWarningPanel() {
        if (!this._warningPanelVisible) {
            const panel = document.getElementById(AUTH_EXPIRES_WARNING_PANEL_ID);
            if (panel) {
                if (!extendAuthenticationLinkAttached) {
                    const linkElem = document.getElementById(EXTEND_AUTHENTICATION_LINK_ID);
                    if (linkElem) {
                        linkElem.onclick = () => this._extendAuthentication();
                    }
                    extendAuthenticationLinkAttached = true;
                }
                panel.classList.add('show');
                this._warningPanelVisible = true;
            } else {
                console.error(`No element with id ${AUTH_EXPIRES_WARNING_PANEL_ID} found! Cannot display logout warning.`);
            }
        }
    }

    _hideWarningPanel() {
        if (this._warningPanelVisible) {
            const panel = document.getElementById(AUTH_EXPIRES_WARNING_PANEL_ID);
            if (panel) {
                panel.classList.remove('show');
            }
            this._warningPanelVisible = false;
        }
    }

    _logout() {
        this._portalUserService.logout();
    }

}
