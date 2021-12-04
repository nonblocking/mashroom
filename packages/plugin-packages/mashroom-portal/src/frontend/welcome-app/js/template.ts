
export default (resourcesBasePath: string, ssr = false) => `
    <div class="mashroom-welcome-portal-app">
        <h4>Welcome to the Mashroom Portal Server!</h4>
        <div class="welcome-app-content">
            <img src="${resourcesBasePath}/welcome-app/assets/mashroom_logo.png" width="60" height="60" alt="Mashroom Server" />
            <p>
                This demo portal page integrates multiple standalone (single page) applications.
                <br/>
                All of them are written in different frontend technologies.
                <br/>
                They make use of the frontend messaging bus to communicate with each other (Ping button!).
                <br />
                <small>(This has rendered on the ${ssr ? 'server-side' : 'client-side'})</small>
            </p>
        </div>
    </div>
`;
