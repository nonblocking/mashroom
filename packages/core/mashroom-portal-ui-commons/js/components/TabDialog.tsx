
import React, {useMemo} from 'react';
import TabHeader from './TabHeader';

import type {ReactNode} from 'react';

type Props = {
    activeTabName: string;
    setActiveTabName: (name: string) => void;
    tabs: Array<{
        name: string;
        titleId: string;
        content: ReactNode;
    }>;
}

export default ({activeTabName, setActiveTabName, tabs}: Props) => {
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
                onChangeActiveTab={setActiveTabName}
            />
            {activeTabIndex !== null && (
                <div className='tab-dialog-content-wrapper'>
                    {tabs[activeTabIndex]?.content}
                </div>
            )}
        </div>
    );
};

