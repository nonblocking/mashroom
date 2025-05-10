
import React, {useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {setActiveTab} from '../store/actions';
import TabHeader from './TabHeader';

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
    const onChangeActiveTab = (newActiveTab: string) => dispatch(setActiveTab(name, newActiveTab));

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

    return (
        <div className='mashroom-portal-ui-tab-dialog'>
            <TabHeader
                tabs={tabs}
                activeTabIndex={activeTabIndex}
                onChangeActiveTab={onChangeActiveTab}
            />
            {activeTabIndex !== null && (
                <div className='tab-dialog-content-wrapper'>
                    {tabs[activeTabIndex]?.content}
                </div>
            )}
        </div>
    );
};

