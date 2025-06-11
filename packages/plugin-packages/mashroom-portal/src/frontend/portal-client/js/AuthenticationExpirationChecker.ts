
import {
    WINDOW_VAR_PORTAL_AUTHENTICATION_EXPIRED_MESSAGE,
    WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION,
    WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION,
    WINDOW_VAR_PORTAL_ON_AUTHENTICATION_EXPIRATION,
    WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRATION_SEC,
} from '../../../backend/constants';

import type {MashroomPortalUserService} from '../../../../type-definitions';
import type {MashroomPortalOnAuthenticationExpirationStrategies} from '../../../../type-definitions/internal';

const checkAuthenticationExpiration: boolean = (global as any)[WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION];
const warnBeforeAuthenticationExpirationSec: number = (global as any)[WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRATION_SEC] ?? 60;
const autoExtendAuthentication: boolean = (global as any)[WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION];
const onAuthenticationExpiration: MashroomPortalOnAuthenticationExpirationStrategies = (global as any)[WINDOW_VAR_PORTAL_ON_AUTHENTICATION_EXPIRATION];
const authenticationExpiredMessage: string = (global as any)[WINDOW_VAR_PORTAL_AUTHENTICATION_EXPIRED_MESSAGE];

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
        if (!checkAuthenticationExpiration || warnBeforeAuthenticationExpirationSec <= 0) {
            return;
        }

        console.info('Starting authentication expiration checker');
        this._startCheckTimer(30);
    }

    private _startCheckTimer(timoutSec: number) {
        setTimeout(() => this._checkExpirationTime(), timoutSec * 1000);
    }

    private async _checkExpirationTime(): Promise<void> {
        const timeLeft = this._getTimeLeftSec();
        if (timeLeft <= warnBeforeAuthenticationExpirationSec && timeLeft > 5 && timeLeft % 5 !== 0) {
            // Limit the server requests to max once per 5sec
            this._timeToAuthenticationExpirationMs = this._timeToAuthenticationExpirationMs! - 1000;
            this._handleExpirationTimeUpdate();
            return;
        }

        const timeToExpiration = await this._portalUserService.getTimeToAuthenticationExpiration();

        if (timeToExpiration !== null) {
            this._timeToAuthenticationExpirationMs = timeToExpiration;
        } else {
            // Assume the user has a couple of minutes left and check again in 60 sec (in _handleExpirationTimeUpdate())
            this._timeToAuthenticationExpirationMs = (warnBeforeAuthenticationExpirationSec + 300) * 1000;
        }
        this._handleExpirationTimeUpdate();
    }

    private _extendAuthentication() {
        this._portalUserService.extendAuthentication();
        this._timeToAuthenticationExpirationMs = (warnBeforeAuthenticationExpirationSec + 10) * 1000;
    }

    private _handleExpirationTimeUpdate() {
        const timeLeft = this._getTimeLeftSec();
        console.debug(`Authentication expires in ${timeLeft}sec`);

        if (timeLeft <= 0) {
            this._handleSessionExpiration();
        } else if (timeLeft <= warnBeforeAuthenticationExpirationSec) {
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
            const nextCheck = Math.max(1, Math.min(60, timeLeft - warnBeforeAuthenticationExpirationSec));
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

        const timeElem = global.document.getElementById(AUTH_EXPIRES_TIME_ELEM_ID);
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

    private _getWarningPanel() {
        return global.document.getElementById(AUTH_EXPIRES_WARNING_PANEL_ID);
    }

    private _showWarningPanel() {
        if (!this._warningPanelVisible) {
            const panel = this._getWarningPanel();
            if (panel) {
                if (!extendAuthenticationLinkAttached) {
                    const linkElem = global.document.getElementById(EXTEND_AUTHENTICATION_LINK_ID);
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
            const panel = this._getWarningPanel();
            if (panel) {
                panel.classList.remove('show');
            }
            this._warningPanelVisible = false;
        }
    }

    private _handleSessionExpiration() {
        console.debug('Session expired. Using onExpiration strategy:', onAuthenticationExpiration.strategy);
        switch (onAuthenticationExpiration.strategy) {
        case 'stayOnPage': {
            let panel = this._getWarningPanel();
            if (panel) {
                if (panel.firstElementChild != null && panel.firstElementChild.tagName === 'DIV') {
                    panel = panel.firstElementChild as HTMLDivElement;
                }
                panel.innerHTML = authenticationExpiredMessage;
            }
            break;
        }
        case 'redirect':
            global.location.replace(onAuthenticationExpiration.url);
            break;
        case 'displayDomElement': {
            this._hideWarningPanel();
            const domElement = global.document.getElementById(onAuthenticationExpiration.elementId);
            if (domElement) {
                domElement.style.display = 'block';
            } else {
                console.error('Invalid onAuthenticationStrategy: DOM element not found:', onAuthenticationExpiration.elementId);
            }
            break;
        }
        case 'reload':
        default:
            // We just call logout which will also reload the current page
            this._portalUserService.logout();
        }
    }

}
