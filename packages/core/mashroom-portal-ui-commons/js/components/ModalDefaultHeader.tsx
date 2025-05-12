import React from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    titleId?: string;
    title?: string;
    onClose: () => void;
}

export default ({titleId, title, onClose}: Props) => {
    return (
        <div className='mashroom-portal-ui-modal-header'>
            <div className='title'>
                {titleId ? <FormattedMessage id={titleId}/> : title}
            </div>
            <div className='close-button' onClick={onClose}/>
        </div>
    );
};
