
import React from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    labelId?: string;
    label?: string;
    onClick?: () => void;
};

export default ({labelId, label, onClick}: Props) => {
    return (
        <div className='mashroom-portal-ui-dropdown-menu-item' onClick={onClick}>
            <span className='dropdown-menu-item-label'>{labelId ? <FormattedMessage id={labelId}/> : label}</span>
        </div>
    );
};
