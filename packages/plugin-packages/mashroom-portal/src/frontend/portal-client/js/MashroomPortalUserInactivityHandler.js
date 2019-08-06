// @flow

import {WINDOW_VAR_PORTAL_LOGOUT_AFTER_INACTIVITY_SEC} from '../../../backend/constants';

import type {MashroomPortalUserService} from '../../../../type-definitions';

const AUTO_LOGOUT_AFTER_INACTIVITY_SEC: number = global[WINDOW_VAR_PORTAL_LOGOUT_AFTER_INACTIVITY_SEC];
const SHOW_WARNING_THRESHOLD_SEC = 30;

const AUTO_LOGOUT_WARNING_PANEL_ID = 'mashroom-portal-auto-logout-warning';
const AUTO_LOGOUT_SECONDS_ELEM_ID = 'mashroom-portal-auto-logout-seconds';

export default class MashroomPortalUserInactivityHandler {

    _portalUserService: MashroomPortalUserService;
    _userInteraction: boolean;
    _sessionEndTime: number;
    _warningPanelVisible: boolean;
    _boundHandlePassedTime: () => void;

    constructor(portalUserService: MashroomPortalUserService) {
        this._portalUserService = portalUserService;
        this._userInteraction = false;
        this._sessionEndTime = Date.now() + AUTO_LOGOUT_AFTER_INACTIVITY_SEC * 1000;
        this._warningPanelVisible = false;
        this._boundHandlePassedTime = this._handleTimePassed.bind(this);
    }

    start() {
        if (typeof(AUTO_LOGOUT_AFTER_INACTIVITY_SEC) !== 'number' || AUTO_LOGOUT_AFTER_INACTIVITY_SEC <= 0) {
            console.info('Auto logout after inactivity disabled.');
            return;
        }

        console.info(`Will auto logout user after ${AUTO_LOGOUT_AFTER_INACTIVITY_SEC}sec inactivity`);

        this._startTimer(10);

        // Install global event listeners
        const userInteractionHandler = this._handleUserInteraction.bind(this);
        global.addEventListener('mousemove', userInteractionHandler);
        global.addEventListener('touch', userInteractionHandler);
        global.addEventListener('keydown', userInteractionHandler);
    }

    _startTimer(secs: number) {
        setTimeout(this._boundHandlePassedTime, secs * 1000);
    }

    _getTimeLeft() {
        return Math.max(0, Math.trunc((this._sessionEndTime - Date.now()) / 1000));
    }

    _handleTimePassed() {
        if (this._userInteraction) {
            this._sessionEndTime = Date.now() + AUTO_LOGOUT_AFTER_INACTIVITY_SEC * 1000;
            this._hideWarningPanel();
            this._userInteraction = false;
        }

        const timeLeft = this._getTimeLeft();
        // console.debug('Time left until auto logout: ', timeLeft);

        if (timeLeft <= 0) {
            this._logout();
            this._hideWarningPanel();
        } else if (timeLeft <= SHOW_WARNING_THRESHOLD_SEC) {
            this._showTimeLeft();
            this._startTimer(1);
        } else {
            this._startTimer(10);
        }
    }

    _showTimeLeft() {
        this._showWarningPanel();

        const secondsElem = document.getElementById(AUTO_LOGOUT_SECONDS_ELEM_ID);
        if (secondsElem) {
            const timeLeft = this._getTimeLeft();
            let seconds = String(timeLeft);
            if (timeLeft < 10) {
                seconds = '0' + seconds;
            }
            secondsElem.innerHTML = seconds;
        } else {
            console.error(`No element with id ${AUTO_LOGOUT_SECONDS_ELEM_ID} found! Cannot display seconds until logout.`);
        }
    }

    _showWarningPanel() {
        if (!this._warningPanelVisible) {
            const panel = document.getElementById(AUTO_LOGOUT_WARNING_PANEL_ID);
            if (panel) {
                panel.classList.add('show');
                this._warningPanelVisible = true;
            } else {
                console.error(`No element with id ${AUTO_LOGOUT_WARNING_PANEL_ID} found! Cannot display logout warning.`);
            }
        }
    }

    _hideWarningPanel() {
        if (this._warningPanelVisible) {
            const panel = document.getElementById(AUTO_LOGOUT_WARNING_PANEL_ID);
            if (panel) {
                panel.classList.remove('show');
            }
            this._warningPanelVisible = false;
        }
    }

    _logout() {
        this._portalUserService.logout();
    }

    _handleUserInteraction() {
        this._userInteraction = true;
    }
}
