import React, {useRef, useCallback, useContext} from 'react';
import {
    CircularProgress,
    DropdownMenu,
    ErrorMessage,
    setShowModal,
} from '@mashroom/mashroom-portal-ui-commons';
import {useDispatch, useSelector} from 'react-redux';
import { DIALOG_NAME_PAGE_CONFIGURE, DIALOG_NAME_PAGE_DELETE } from '../constants';
import {setSelectedPage} from '../store/actions';
import {DependencyContext} from '../DependencyContext';

import type {FlatPage, State} from '../types';

const padWithSpaces = (nr: number) => {
    const items = [];
    for (let i = 0; i < nr; i++) {
        items.push(<span key={`space-${i}`}>&nbsp;</span>);
    }
    return items;
};

export default () => {
    const closeDropDownRef = useRef<(() => void) | undefined>(undefined);
    const {pages} = useSelector((state: State) => state);
    const dispatch = useDispatch();
    const showModal = (name: string) => dispatch(setShowModal(name, true));
    const initConfigurePage = (pageId: string) => dispatch(setSelectedPage(pageId));
    const {dataLoadingService, portalSiteService} = useContext(DependencyContext);

    const handleOpen = useCallback(() => {
        dataLoadingService.loadPageTree();
    }, []);

    const handleConfigure = useCallback((page: FlatPage) => {
        closeDropDownRef.current?.();
        initConfigurePage(page.pageId);
        showModal(DIALOG_NAME_PAGE_CONFIGURE);
    }, []);

    const handleDelete = useCallback((page: FlatPage) => {
        closeDropDownRef.current?.();
        initConfigurePage(page.pageId); // To set the context for which page to delete
        showModal(DIALOG_NAME_PAGE_DELETE);
    }, []);

    const callOnEnter = (
        event: React.KeyboardEvent<HTMLDivElement>,
        action: () => void
    ) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    };

    let dropdownContent;
    if (pages.loading) {
        dropdownContent = <CircularProgress />;
    } else if (pages.error || !pages.pagesFlattened) {
        dropdownContent = <ErrorMessage messageId='loadingFailed' />;
    } else if (pages.pagesFlattened.length === 0) {
        dropdownContent = <div className='no-pages-message'>No pages available.</div>;
    } else {
        const pageItems = pages.pagesFlattened.map((page) => {
            const pageUrl = `${portalSiteService.getCurrentSiteUrl()}${page.friendlyUrl}`;
            return  (
                <div key={page.pageId} className='page'>
                    <div className='portal-page-link'>
                        {padWithSpaces(page.level * 2)}
                        <a href={pageUrl}>
                            {page.title}
                        </a>
                    </div>
                    <div
                        className='configure'
                        onClick={() => handleConfigure(page)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => callOnEnter(e, () => handleConfigure(page))}
                    >
                        &nbsp;
                    </div>
                    <div
                        className='delete'
                        onClick={() => handleDelete(page)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => callOnEnter(e, () => handleDelete(page))}
                    >
                        &nbsp;
                    </div>
                </div>
            );
        });
        dropdownContent = <div className='pages'>{pageItems}</div>;
    }

    return (
        <DropdownMenu
            className='pages-dropdown-menu'
            labelId='pages'
            onOpen={handleOpen}
            closeRef={(ref) => (closeDropDownRef.current = ref)}
        >
            {dropdownContent}
        </DropdownMenu>
    );
};
