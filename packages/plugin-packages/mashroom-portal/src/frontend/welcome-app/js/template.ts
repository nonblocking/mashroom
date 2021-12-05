
import logoImg from '../assets/mashroom_logo.png';

export default (resourcesBasePath: string) => `
    <div class="mashroom-welcome-portal-app">
        <h4>Welcome to the Mashroom Portal Server!</h4>
        <div class="welcome-app-content">
            <img src="${resourcesBasePath}/${logoImg}" width="60" height="60" alt="Mashroom Server" />
            <p>
                This demo Portal page integrates multiple Single Page Applications (SPAs).
                <br/>
                All of them are written in different frontend technologies and developed standalone and independent of this Portal.
                <br/>
                They make use of the frontend messaging bus to communicate with each other (Ping button!).
            </p>
        </div>
    </div>
`;
