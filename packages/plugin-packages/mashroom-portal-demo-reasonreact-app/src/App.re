[%bs.raw {|require('./App.scss')|}];
[@bs.module] external icon: string = "./reason.svg";

type appConfig = {firstName: string};

type payload = {
  dummy: int,
};

type mashroomPortalMessageBus = {
  subscribe: (string, unit => unit) => unit,
  unsubscribe: string => unit,
  publish: (string, payload) => unit,
};

[@react.component]
let make = (~appConfig: appConfig, ~messageBus: mashroomPortalMessageBus) => {
  let (ping, setPing) = React.useState(_ => 0);
  let onClick = _ => messageBus.publish("ping", {dummy: 42});

  React.useEffect0(() => {
    messageBus.subscribe("ping", () => setPing(prevPing => prevPing + 1));
    Some(() => messageBus.unsubscribe("ping"));
  });

  <div className="mashroom-demo-react-app">
    <div dangerouslySetInnerHTML={{"__html": icon}} className="demo-reason-icon"></div>
    <div className="demo-reason-react-app-content">
      <h4> {React.string("Reason-React Demo App")} </h4>
      <p> {React.string("Hello " ++ appConfig.firstName ++ "!")} </p>
      <div>
        <button onClick>
          {React.string("Send Ping")}
        </button>
        <span>
          {React.string("Received pings: " ++ string_of_int(ping))}
        </span>
      </div>
    </div>
  </div>
};
