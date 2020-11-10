
function startPortalAppEnhancementTestApp(portalAppHostElement, portalAppSetup, clientServices) {
    var infoText = portalAppSetup.appConfig.info;

    var wrapper = document.createElement('div');
    wrapper.style.padding = '10px';
    var info = document.createElement('p');
    info.innerText = infoText;
    var button = document.createElement('button');
    button.innerText = 'Call custom service';
    button.onclick = function() {
        clientServices.customService.test();
    };
    wrapper.appendChild(info);
    wrapper.appendChild(button);

    portalAppHostElement.innerHTML = '';
    portalAppHostElement.appendChild(wrapper);
}
