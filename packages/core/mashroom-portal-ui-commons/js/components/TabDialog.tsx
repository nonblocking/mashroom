
import React, {useMemo} from 'react';
import {FormattedMessage} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {setActiveTab} from '../store/actions';

import type {ReactNode} from 'react';
import type {CommonState} from '../../type-definitions';

type Props = {
    name: string;
    tabs: Array<{
        name: string;
        titleId: string;
        content: ReactNode;
    }>;
}

export default ({name, tabs}: Props) => {
    const activeTabName = useSelector((state: CommonState) => state.tabDialogs?.[name]?.active);
    const dispatch = useDispatch();

    const onChangeActiveTab = (newActiveTab: string) => {
        dispatch(setActiveTab(name, newActiveTab));
    };

    const activeTabIndex = useMemo((): number | null => {
        const activeTab = tabs.find((t) => t.name === activeTabName);
        if (activeTab) {
            return tabs.indexOf(activeTab);
        }
        if (tabs.length > 0) {
            return 0;
        }

        return null;
    }, [tabs, activeTabName]);

    const header = useMemo(() => {
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
    }, [tabs, activeTabIndex]);

    return (
        <div className='mashroom-portal-ui-tab-dialog'>
            {header}
            {activeTabIndex !== null && (
                <div className='tab-dialog-content-wrapper'>
                    {tabs[activeTabIndex]?.content}
                </div>
            )}
        </div>
    );
};

