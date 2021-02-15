
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {injectIntl} from 'react-intl';
import AddAppDropdownMenu from '../components/AddAppDropdownMenu';
import {DependencyContextConsumer} from '../DependencyContext';

import type {IntlShape} from 'react-intl';

import type {State} from '../types';

type IntlProps = {
    intl: IntlShape
}

type Props = IntlProps;

class AddAppDropdownMenuContainer extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <AddAppDropdownMenu dataLoadingService={deps.dataLoadingService} portalAppManagementService={deps.portalAppManagementService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State) => ({
});


export default connect(mapStateToProps)(injectIntl(AddAppDropdownMenuContainer));
