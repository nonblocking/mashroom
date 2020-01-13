// @flow

import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {injectIntl} from 'react-intl';
import AddAppDropdownMenu from '../components/AddAppDropdownMenu';
import {DependencyContextConsumer} from '../DependencyContext';

import type {IntlShape} from 'react-intl';

import type {ComponentType} from 'react';
import type {State} from '../../../type-definitions';

type OwnProps = {|
|}

type IntlProps = {|
    intl: IntlShape
|}

type Props = IntlProps & OwnProps;

class AddAppDropdownMenuContainer extends PureComponent<Props> {

    render() {
        return (
            <DependencyContextConsumer>
                {(deps) => <AddAppDropdownMenu dataLoadingService={deps.dataLoadingService} portalAppManagementService={deps.portalAppManagementService} {...this.props}/>}
            </DependencyContextConsumer>
        );
    }
}

const mapStateToProps = (state: State, ownProps: OwnProps) => ({
});


export default (connect(mapStateToProps)(injectIntl(AddAppDropdownMenuContainer)): ComponentType<OwnProps>);
