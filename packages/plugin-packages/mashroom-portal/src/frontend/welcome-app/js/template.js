// @flow

import logoImg from '../assets/mashroom_logo.png';

export default () => `
    <div class="mashroom-welcome-portal-app">
        <h4>Welcome to the Mashroom Portal Server!</h4>
        <div class="welcome-app-content">
            <img src="${logoImg}"/>
            <p>
                This demonstration portal page integrates multiple standalone (single page) apps.
                <br/>
                All of them are written in different frontend technologies.
                <br/>
                They make use of the frontend messaging bus to communicate with each other (Ping button!).
            </p>
        </div>
    </div>
`;
