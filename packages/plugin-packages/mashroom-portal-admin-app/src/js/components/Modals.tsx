
import React, {PureComponent} from 'react';
import PortalAppConfigureDialog from '../containers/PortalAppConfigureDialog';
import PageConfigureDialog from '../containers/PageConfigureDialog';
import PageDeleteDialog from '../containers/PageDeleteDialog';
import SiteConfigureDialog from '../containers/SiteConfigureDialog';
import SiteDeleteDialog from '../containers/SiteDeleteDialog';

type Props = Record<string, never>;

export default class Modals extends PureComponent<Props> {

    render() {
        return (
            <>
                <PortalAppConfigureDialog/>
                <PageConfigureDialog/>
                <PageDeleteDialog/>
                <SiteConfigureDialog/>
                <SiteDeleteDialog/>
            </>
        );
    }
}
