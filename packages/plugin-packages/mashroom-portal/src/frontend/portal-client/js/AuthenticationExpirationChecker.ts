
import {
    WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION,
    WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION,
    WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC,
} from '../../../backend/constants';

import type {MashroomPortalUserService} from '../../../../type-definitions';

const checkAuthenticationExpiration: boolean = (global as any)[WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION];
const warnBeforeAuthenticationExpiresSec: number = (global as any)[WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC] ?? 60;
const autoExtendAuthentication: boolean = (global as any)[WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION];

const AUTH_EXPIRES_WARNING_PANEL_ID = 'mashroom-portal-auth-expires-warning';
const AUTH_EXPIRES_TIME_ELEM_ID = 'mashroom-portal-auth-expires-time';
const EXTEND_AUTHENTICATION_LINK_ID = 'mashroom-portal-auth-expires-extend';

let extendAuthenticationLinkAttached = false;

export default class MashroomPortalUserInactivityHandler {

    private _timeToAuthenticationExpirationMs: number | null;
    private _warningPanelVisible: boolean;

    constructor(private _portalUserService: MashroomPortalUserService) {
        this._timeToAuthenticationExpirationMs = null;
        this._warningPanelVisible = false;
    }

    start(): void {
        if (!checkAuthenticationExpiration || warnBeforeAuthenticationExpiresSec <= 0) {
            return;
        }

        console.info('Starting authentication expiration checker');
        this._startCheckTimer(30);
    }

    private _startCheckTimer(timoutSec: number) {
        setTimeout(() => this._checkExpirationTime(), timoutSec * 1000);
    }

    private _checkExpirationTime() {
        const timeLeft = this._getTimeLeftSec();
        if (timeLeft <= warnBeforeAuthenticationExpiresSec && timeLeft > 5 && timeLeft % 5 !== 0) {
            // Limit the server requests to max once per 5sec
            this._timeToAuthenticationExpirationMs = this._timeToAuthenticationExpirationMs! - 1000;
            this._handleExpirationTimeUpdate();
            return;
        }

        this._portalUserService.getTimeToAuthenticationExpiration().then(
            (timeToExpiration) => {
                if (timeToExpiration !== null) {
                    this._timeToAuthenticationExpirationMs = timeToExpiration;
                } else {
                    // Just assume the user have a couple of minutes left and check again in 60sec (in _handleExpirationTimeUpdate())
                    this._timeToAuthenticationExpirationMs = (warnBeforeAuthenticationExpiresSec + 300) * 1000;
                }
                this._handleExpirationTimeUpdate();
            }
        );
    }

    private _extendAuthentication() {
        this._portalUserService.extendAuthentication();
        this._timeToAuthenticationExpirationMs = (warnBeforeAuthenticationExpiresSec + 10) * 1000;
    }

    private _handleExpirationTimeUpdate() {
        const timeLeft = this._getTimeLeftSec();
        console.debug(`Authentication expires in ${timeLeft}sec`);

        if (timeLeft <= 0) {
            this._handleSessionExpired();
        } else if (timeLeft <= warnBeforeAuthenticationExpiresSec) {
            if (autoExtendAuthentication) {
                console.info('Auto extending authentication');
                this._extendAuthentication();
            } else {
                this._showTimeLeft();
            }
            this._startCheckTimer(1);
        } else {
            this._hideWarningPanel();
            // Re-check after 60sec at latest
            const nextCheck = Math.max(1, Math.min(60, timeLeft - warnBeforeAuthenticationExpiresSec));
            this._startCheckTimer(nextCheck);
        }
    }

    private _getTimeLeftSec() {
        if (this._timeToAuthenticationExpirationMs) {
            return Math.trunc((this._timeToAuthenticationExpirationMs) / 1000);
        }
        return -1;
    }

    private _showTimeLeft() {
        this._showWarningPanel();

        const timeElem = document.getElementById(AUTH_EXPIRES_TIME_ELEM_ID);
        if (timeElem) {
            const timeLeft = this._getTimeLeftSec();
            timeElem.innerHTML = this._formatTime(timeLeft);
        } else {
            console.error(`No element with id ${AUTH_EXPIRES_TIME_ELEM_ID} found! Cannot display seconds until logout.`);
        }
    }

    private _formatTime(timeSec: number) {
        const minutes = Math.trunc(timeSec / 60);
        const seconds = timeSec - minutes * 60;
        return `${minutes < 10 ? '0': ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    private _showWarningPanel() {
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

    private _hideWarningPanel() {
        if (this._warningPanelVisible) {
            const panel = document.getElementById(AUTH_EXPIRES_WARNING_PANEL_ID);
            if (panel) {
                panel.classList.remove('show');
            }
            this._warningPanelVisible = false;
        }
    }

    private _handleSessionExpired() {
        // We just call logout which will also reload the current page
        this._portalUserService.logout();
    }

}
