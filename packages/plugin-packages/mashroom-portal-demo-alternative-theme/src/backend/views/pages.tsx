
import React from 'react';
import type {MashroomPortalPageRefLocalized} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    siteBasePath: string;
    currentPage: MashroomPortalPageRefLocalized;
    pages: Array<MashroomPortalPageRefLocalized>;
}

const Pages = ({ currentPage, pages, siteBasePath }: Props) => (
    <ul key={currentPage.pageId} className="nav">
        {
            pages.map(({ hidden, pageId, title, friendlyUrl, subPages }) => {
                if (hidden) {
                    return null;
                }
                const isCurrentPage = pageId === currentPage.pageId;
                return (
                    <li key={pageId} className="nav-item">
                        {isCurrentPage && <a className="nav-link active" href="" data-mr-page-id={pageId} data-mr-page-title={title}>{title}</a>}
                        {!isCurrentPage && <a className="nav-link" href={`${siteBasePath}${friendlyUrl}`} data-mr-page-id={pageId} data-mr-page-title={title}>{title}</a>}
                        {subPages && <Pages pages={subPages} currentPage={currentPage} siteBasePath={siteBasePath} />}
                    </li>
                )
            })
        }
    </ul>
);

export default Pages;
