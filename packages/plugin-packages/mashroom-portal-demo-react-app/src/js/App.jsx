// @flow

import React, {PureComponent} from 'react';
import InlineSVG from './InlineSVG';
import ReactLogo from '../assets/React-icon.svg';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    appConfig: {
        firstName: string
    },
    messageBus: MashroomPortalMessageBus
}

type State = {
    pings: number
}

export default class App extends PureComponent<Props, State> {

    pingReceiver: () => void;

    constructor() {
        super();
        this.state = {
            pings: 0,
        };
        this.pingReceiver = () => {
            this.setState({
                pings: this.state.pings + 1,
            });
        };
    }

    componentDidMount() {
        this.props.messageBus.subscribe('ping', this.pingReceiver);
    }

    componentWillUnmount() {
        this.props.messageBus.unsubscribe('ping', this.pingReceiver);
    }

    sendPing() {
        this.props.messageBus.publish('ping', {});
    }

    render() {
        return (
            <div className='mashroom-demo-react-app'>
                <InlineSVG className='react-logo' svgData={ReactLogo}/>
                <div className="demo-react-app-content">
                    <h4>React Demo App</h4>
                    <p>Hello {this.props.appConfig.firstName}!</p>
                    <div>
                        <button onClick={this.sendPing.bind(this)}>Send Ping</button>
                        <span>Received pings: {this.state.pings}</span>
                    </div>
                </div>
            </div>
        );
    }

}
