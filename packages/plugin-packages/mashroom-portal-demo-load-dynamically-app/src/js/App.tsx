
import React, {PureComponent} from 'react';

import type {ReactNode} from 'react';
import type {MashroomPortalAppService} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    portalAppService: MashroomPortalAppService;
}

type State = {
    messages: {
        [pluginName: string]: string;
    };
    addCloseButtons: {
        [pluginName: string]: boolean;
    };
}

const APPS = [
    'Mashroom Portal Demo React App',
    'Mashroom Portal Demo Vue App',
    'Mashroom Portal Demo Angular App'
];

export default class App extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            messages: {},
            addCloseButtons: {}
        };
    }

    componentDidMount() {
        this.props.portalAppService.registerAppLoadedListener(this.onAppLoadedUpdate.bind(this));
        this.props.portalAppService.registerAppAboutToUnloadListener(this.onAppLoadedUpdate.bind(this));
    }

    onAppLoadedUpdate() {
        setTimeout(() => {
            this.forceUpdate();
        }, 250);
    }

    loadApp(pluginName: string) {
        this.props.portalAppService.loadApp('app-area2', pluginName, null, null, this.getOverrideConfig(pluginName)).then(
            (loadedApp) => {
                if (this.state.addCloseButtons[pluginName]) {
                    // Force show header
                    loadedApp.portalAppWrapperElement.classList.add('show-header');

                    const closeButton = document.createElement('div');
                    closeButton.className = 'mashroom-portal-app-header-close';
                    closeButton.onclick = () => {
                        this.props.portalAppService.unloadApp(loadedApp.id);
                    };

                    loadedApp.portalAppTitleElement?.parentElement?.appendChild(closeButton);
                }
            }
        );
    }

    loadAppModal(pluginName: string) {
        this.props.portalAppService.loadAppModal(pluginName, null, this.getOverrideConfig(pluginName));
    }

    unloadApp(pluginName: string) {
        this.props.portalAppService.loadedPortalApps.forEach((app) => {
            if (app.pluginName === pluginName) {
                this.props.portalAppService.unloadApp(app.id);
            }
        });
    }

    getOverrideConfig(pluginName: string) {
        if (this.state.messages[pluginName]) {
            return {
                message: this.state.messages[pluginName]
            };
        }
        return null;
    }

    onMessageValueChange(message: string, pluginName: string) {
        this.setState({
            messages: { ...this.state.messages, [pluginName]: message,}
        });
    }

    onAddCloseButtonChange(checked: boolean, pluginName: string) {
        this.setState({
            addCloseButtons: { ...this.state.addCloseButtons, [pluginName]: checked,}
        });
    }

    renderAvailableApps() {
        const rows: Array<ReactNode> = [];

        APPS.forEach((pluginName, idx) => {

            const anyLoaded = this.props.portalAppService.loadedPortalApps.find((la) => la.pluginName === pluginName);

            rows.push(
                <tr>
                    <td>{pluginName}</td>
                    <td>
                        Message:
                        <input type='text' value={this.state.messages[pluginName] || ''} onChange={(e) => this.onMessageValueChange(e.target.value, pluginName)}/>
                    </td>
                    <td>
                        <input type='checkbox' className='mashroom-portal-checkbox' id={`add_close_button_${idx}`} name={`add_close_button_${idx}`} checked={this.state.addCloseButtons[pluginName]} onChange={(e) => this.onAddCloseButtonChange(e.target.checked, pluginName)}/>
                        <label htmlFor={`add_close_button_${idx}`}>&nbsp;</label>
                    </td>
                    <td>
                        <a href="javascript:void(0)" onClick={this.loadApp.bind(this, pluginName)}>Load</a><br/>
                        <a href="javascript:void(0)" onClick={this.loadAppModal.bind(this, pluginName)}>Load Modal</a><br/>
                        {anyLoaded && <a href="javascript:void(0)" onClick={this.unloadApp.bind(this, pluginName)}>Unload all</a>}
                    </td>
                </tr>
            );
        });

        return (
            <table>
                <tr>
                    <th>App name</th>
                    <th>Override config</th>
                    <th>Add close button</th>
                    <th>&nbsp;</th>
                </tr>
                {rows}
            </table>
        );
    }

    render() {
        return (
            <div className='mashroom-demo-load-dynamically-app'>
                <h4>Available apps</h4>
                {this.renderAvailableApps()}
            </div>
        );
    }

}
