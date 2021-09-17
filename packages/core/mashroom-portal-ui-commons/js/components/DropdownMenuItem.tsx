
import React, {PureComponent} from 'react';
import {FormattedMessage} from 'react-intl';
import type {ReactNode} from 'react';

type Props = {
    labelId?: string;
    label?: string;
    onClick?: () => void;
};

export default class DropdownMenuItem extends PureComponent<Props> {

    onClick(): void {
        const {onClick} = this.props;
        if (onClick) {
            onClick();
        }
    }

    render(): ReactNode {
        const {labelId, label} = this.props;
        return (
            <div className='mashroom-portal-ui-dropdown-menu-item' onClick={this.onClick.bind(this)}>
                <span className='dropdown-menu-item-label'>{labelId ? <FormattedMessage id={labelId}/> : label}</span>
            </div>
        );
    }
}
