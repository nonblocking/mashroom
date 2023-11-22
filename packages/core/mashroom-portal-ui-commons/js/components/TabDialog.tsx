
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

import type {ReactNode} from 'react';

type Props = {
    name: string;
    tabs: Array<{
        name: string;
        titleId: string;
        content: ReactNode;
    }>;
    activeTab?: string;
    setActiveTab: (name: string) => void;
    className?: string;
}

export default class TabDialog extends PureComponent<Props> {

    getActiveTabIndex(): number | null {
        const {tabs} = this.props;
        const activeTab = tabs.find((t) => t.name === this.props.activeTab);
        if (activeTab) {
            return tabs.indexOf(activeTab);
        }
        if (tabs.length > 0) {
            return 0;
        }

        return null;
    }

    onChangeActiveTab(name: string) {
        const {setActiveTab} = this.props;
        setActiveTab(name);
    }

    renderHeader() {
        const {tabs} = this.props;
        const activeTabIndex = this.getActiveTabIndex();
        if (activeTabIndex === null) {
            return null;
        }

        const buttons = tabs.map((t, idx) => (
            <div key={t.name} className={`tab-dialog-button ${idx === activeTabIndex ? 'active' : ''}`} onClick={this.onChangeActiveTab.bind(this, t.name)}>
                <div className='title'><FormattedMessage id={t.titleId} /></div>
            </div>
        ));

        return (
            <div className='tab-dialog-header'>
                {buttons}
            </div>
        );
    }

    listenErroneousFieldEvents(name: string, element: HTMLDivElement | null) {
        const {activeTab, setActiveTab} = this.props;
        if (element) {
            element.addEventListener('erroneous-field-focused', () => {
                if (activeTab !== name) {
                    console.info(`Switching to tab ${name} because an erroneous field was focused there`);
                    setActiveTab(name);
                }
            });
        }
    }

    renderContent() {
        const {tabs} = this.props;
        const activeTabIndex = this.getActiveTabIndex();
        if (activeTabIndex === null) {
            return null;
        }

        return (
            <div className='tab-dialog-content-wrapper'>
                {tabs[activeTabIndex]?.content}
            </div>
        );
    }

    render() {
        return (
            <div className='mashroom-portal-ui-tab-dialog'>
                {this.renderHeader()}
                {this.renderContent()}
            </div>
        );
    }

}

