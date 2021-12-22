
export default (resourcesBasePath: string) => `
    <div class="mashroom-welcome-portal-app">
        <h4>Welcome to the Mashroom Portal!</h4>
        <div class="welcome-app-content">
            <img src="${resourcesBasePath}/welcome-app/assets/logo-primary-shades.svg" width="80" height="80" alt="Mashroom Server" />
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
