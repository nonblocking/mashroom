
import React, {PureComponent} from 'react';
import PortalAppConfigureDialog from '../containers/PortalAppConfigureDialog';
import PageConfigureDialog from '../containers/PageConfigureDialog';
import PageDeleteDialog from '../containers/PageDeleteDialog';
import SiteConfigureDialog from '../containers/SiteConfigureDialog';
import SiteDeleteDialog from '../containers/SiteDeleteDialog';

import type {ReactNode} from 'react';

type Props = Record<string, never>;

export default class Modals extends PureComponent<Props> {

    render(): ReactNode {
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
