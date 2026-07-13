
const bootstrap = (portalAppHostElement, portalAppSetup, clientServices) => {
   portalAppHostElement.innerHTML = `
     <div>
        <h4>Minimal Remote Portal App</h4>
     </div>
   `;
};

window.startMinimalRemotePortalApp = bootstrap;
