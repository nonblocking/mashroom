
import React from 'react';
import SiteConfigureDialog from './SiteConfigureDialog';
import PortalAppConfigureDialog from './PortalAppConfigureDialog';
import SiteDeleteDialog from './SiteDeleteDialog';
import PageDeleteDialog from './PageDeleteDialog';
import PageConfigureDialog from './PageConfigureDialog';

export default () => {
    return (
        <>
            <PortalAppConfigureDialog/>
            <PageConfigureDialog/>
            <PageDeleteDialog/>
            <SiteConfigureDialog/>
            <SiteDeleteDialog/>
        </>
    );
};
