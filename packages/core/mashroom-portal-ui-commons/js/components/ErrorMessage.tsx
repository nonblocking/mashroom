
import React from 'react';
import {Trans} from 'react-i18next';

type Props = {
    messageId: string;
};

export default ({messageId}: Props) => {
    // The messageId can contain placeholder values after ::
    const [id, ...values] = messageId.split('::');
    const valuesObject: any =  {};
    values.forEach((keyAndVal) => {
        const [key, val] = keyAndVal.split(':');
        valuesObject[key] = val;
    });
    return (
        <div className='mashroom-portal-ui-error-message'>
            <Trans i18nKey={id} values={valuesObject} />
        </div>
    );
};
