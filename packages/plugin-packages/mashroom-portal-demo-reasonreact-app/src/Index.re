// Entry point

[@bs.val] external document: Js.t({..}) = "document";
[@bs.val] external window: Js.t({..}) = "window";

let container = document##getElementById("container");

type clientServices = {
    messageBus: App.mashroomPortalMessageBus,
}

type portalAppSetup = {
    appConfig: App.appConfig,
};

type returnType = {
    willBeRemoved: unit => unit,
}

let bootstrap = (portalAppHostElement, portalAppSetup, clientServices): returnType => {
    ReactDOM.render(<App appConfig={portalAppSetup.appConfig} messageBus={clientServices.messageBus}/>, portalAppHostElement);

    {
        willBeRemoved: () => {
            Js.log("Ummounting React app");
            ReactDOM.unmountComponentAtNode(portalAppHostElement)
        }
    };
};

window##startReasonReactDemoApp #= bootstrap;
