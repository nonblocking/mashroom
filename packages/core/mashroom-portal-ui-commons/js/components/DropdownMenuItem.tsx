
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    labelId?: string;
    label?: string;
    onClick?: () => void;
};

export default class DropdownMenuItem extends PureComponent<Props> {

    onClick() {
        const {onClick} = this.props;
        if (onClick) {
            onClick();
        }
    }

    render() {
        const {labelId, label} = this.props;
        return (
            <div className='mashroom-portal-ui-dropdown-menu-item' onClick={this.onClick.bind(this)}>
                <span className='dropdown-menu-item-label'>{labelId ? <FormattedMessage id={labelId}/> : label}</span>
            </div>
        );
    }
}
