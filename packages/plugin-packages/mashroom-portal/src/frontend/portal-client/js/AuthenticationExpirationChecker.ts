
import {
    WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION,
    WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION, WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC
} from '../../../backend/constants';

import type {MashroomPortalUserService} from '../../../../type-definitions';

const checkAuthenticationExpiration: boolean = (global as any)[WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION];
const warnBeforeAuthenticationExpiresSec: number = (global as any)[WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC] || 120;
const autoExtendAuthentication: boolean = (global as any)[WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION];

const AUTH_EXPIRES_WARNING_PANEL_ID = 'mashroom-portal-auth-expires-warning';
const AUTH_EXPIRES_TIME_ELEM_ID = 'mashroom-portal-auth-expires-time';
const EXTEND_AUTHENTICATION_LINK_ID = 'mashroom-portal-auth-expires-extend';

let extendAuthenticationLinkAttached = false;

export default class MashroomPortalUserInactivityHandler {

    private authenticationExpirationTime: number | undefined | null;
    private warningPanelVisible: boolean;

    constructor(private portalUserService: MashroomPortalUserService) {
        this.authenticationExpirationTime = null;
        this.warningPanelVisible = false;
    }

    start(): void {
        if (!checkAuthenticationExpiration) {
            return;
        }

        console.info('Starting authentication expiration checker');
        this.startCheckTimer(30);
    }

    private startCheckTimer(timoutSec: number) {
        setTimeout(() => this.checkExpirationTime(), timoutSec * 1000);
    }

    private checkExpirationTime() {
        this.portalUserService.getAuthenticationExpiration().then(
            (expirationTime) => {
                this.authenticationExpirationTime = expirationTime;
                this.handleExpirationTimeUpdate();
            }
        );
    }

    private extendAuthentication() {
        this.portalUserService.extendAuthentication();
    }

    private handleExpirationTimeUpdate() {
        const timeLeft = this.getTimeLeftSec();
        console.debug(`Authentication expires in ${timeLeft}sec`);

        if (timeLeft <= 0) {
            this.logout();
            this.hideWarningPanel();
        } else if (timeLeft <= warnBeforeAuthenticationExpiresSec) {
            if (autoExtendAuthentication) {
                console.info('Auto extending authentication');
                this.extendAuthentication();
            } else {
                this.showTimeLeft();
            }
            this.startCheckTimer(1);
        } else {
            this.hideWarningPanel();
            const nextCheck = Math.max(10, timeLeft - warnBeforeAuthenticationExpiresSec - 30);
            this.startCheckTimer(nextCheck);
        }
    }

    private getTimeLeftSec() {
        if (this.authenticationExpirationTime) {
            return Math.trunc((this.authenticationExpirationTime - Date.now()) / 1000);
        }
        return -1;
    }

    private showTimeLeft() {
        this.showWarningPanel();

        const timeElem = document.getElementById(AUTH_EXPIRES_TIME_ELEM_ID);
        if (timeElem) {
            const timeLeft = this.getTimeLeftSec();
            timeElem.innerHTML = this.formatTime(timeLeft);
        } else {
            console.error(`No element with id ${AUTH_EXPIRES_TIME_ELEM_ID} found! Cannot display seconds until logout.`);
        }
    }

    private formatTime(timeSec: number) {
        const minutes = Math.trunc(timeSec / 60);
        const seconds = timeSec - minutes * 60;
        return `${minutes < 10 ? '0': ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    private showWarningPanel() {
        if (!this.warningPanelVisible) {
            const panel = document.getElementById(AUTH_EXPIRES_WARNING_PANEL_ID);
            if (panel) {
                if (!extendAuthenticationLinkAttached) {
                    const linkElem = document.getElementById(EXTEND_AUTHENTICATION_LINK_ID);
                    if (linkElem) {
                        linkElem.onclick = () => this.extendAuthentication();
                    }
                    extendAuthenticationLinkAttached = true;
                }
                panel.classList.add('show');
                this.warningPanelVisible = true;
            } else {
                console.error(`No element with id ${AUTH_EXPIRES_WARNING_PANEL_ID} found! Cannot display logout warning.`);
            }
        }
    }

    private hideWarningPanel() {
        if (this.warningPanelVisible) {
            const panel = document.getElementById(AUTH_EXPIRES_WARNING_PANEL_ID);
            if (panel) {
                panel.classList.remove('show');
            }
            this.warningPanelVisible = false;
        }
    }

    private logout() {
        this.portalUserService.logout();
    }

}
