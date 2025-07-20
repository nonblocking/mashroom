import React from 'react';
import {useTranslation} from 'react-i18next';

type Props = {
    tabs: Array<{
        name: string;
        titleId: string;
    }>;
    activeTabIndex: number | null;
    onChangeActiveTab: (name: string) => void;
};

export default ({tabs, activeTabIndex, onChangeActiveTab}: Props) => {
    const {t} = useTranslation();

    if (activeTabIndex === null) {
        return null;
    }
    const buttons = tabs.map((tab, idx) => (
        <div key={tab.name} className={`tab-dialog-button ${idx === activeTabIndex ? 'active' : ''}`} onClick={() => onChangeActiveTab(tab.name)}>
            <div className='title'>
                {t(tab.titleId)}
            </div>
        </div>
    ));
    return (
        <div className='tab-dialog-header'>
            {buttons}
        </div>
    );
};
