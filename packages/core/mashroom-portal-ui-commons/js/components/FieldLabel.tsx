
import React from 'react';
import {FormattedMessage} from 'react-intl';

type Props = {
    labelId: string;
    htmlFor?: string;
}

export default ({labelId, htmlFor}: Props) => {
    return (
        <label htmlFor={htmlFor} className='mashroom-portal-ui-field-label'>
            <FormattedMessage id={labelId}/>
        </label>
    );
};
