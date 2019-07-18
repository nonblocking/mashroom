// @flow

import React, {PureComponent, Fragment} from 'react';
import PortalAppConfigureDialogContainer from '../containers/PortalAppConfigureDialogContainer';
import PageConfigureDialogContainer from '../containers/PageConfigureDialogContainer';
import PageDeleteDialogContainer from '../containers/PageDeleteDialogContainer';
import SiteConfigureDialogContainer from '../containers/SiteConfigureDialogContainer';
import SiteDeleteDialogContainer from '../containers/SiteDeleteDialogContainer';

type Props = {
};

export default class PortalAppConfigureDialog extends PureComponent<Props> {

    render() {
        return (
            <Fragment>
                <PortalAppConfigureDialogContainer/>
                <PageConfigureDialogContainer/>
                <PageDeleteDialogContainer/>
                <SiteConfigureDialogContainer/>
                <SiteDeleteDialogContainer/>
            </Fragment>
        );
    }
}
