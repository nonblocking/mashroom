
export default (svgData: string) => `
    <div class="mashroom-welcome-portal-app">
        <h4>Welcome to Mashroom Portal 3!</h4>
        <div class="welcome-app-content">
            <div class="logo">
                ${svgData}
            </div>
            <p>
                This demo Portal page integrates multiple Microfrontends (SPAs).
                <br/>
                All of them are written in different frontend technologies and developed standalone and independent of this Portal.
                <br/>
                They make use of the frontend messaging bus to communicate with each other (Ping button).
            </p>
        </div>
    </div>
`;
