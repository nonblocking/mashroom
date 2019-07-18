// @flow

import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

import type {Node} from 'react';

type Props = {
    labelId?: string,
    label?: string,
    onClick?: () => void,
};

export default class DropdownMenuItem extends PureComponent<Props> {

    onClick() {
        if (this.props.onClick) {
            this.props.onClick();
        }
    }

    render() {
        return (
            <div className='mashroom-portal-ui-dropdown-menu-item' onClick={this.onClick.bind(this)}>
                <span className='dropdown-menu-item-label'>{this.props.labelId ? <FormattedMessage id={this.props.labelId}/> : this.props.label}</span>
            </div>
        );
    }
}
