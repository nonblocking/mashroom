import React from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    tabs: Array<{
        name: string;
        titleId: string;
    }>;
    activeTabIndex: number | null;
    onChangeActiveTab: (name: string) => void;
};

export default ({tabs, activeTabIndex, onChangeActiveTab}: Props) => {
    if (activeTabIndex === null) {
        return null;
    }
    const buttons = tabs.map((t, idx) => (
        <div key={t.name} className={`tab-dialog-button ${idx === activeTabIndex ? 'active' : ''}`} onClick={() => onChangeActiveTab(t.name)}>
            <div className='title'><FormattedMessage id={t.titleId} /></div>
        </div>
    ));
    return (
        <div className='tab-dialog-header'>
            {buttons}
        </div>
    );
};
