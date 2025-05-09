
import React from 'react';

import type {ReactNode} from 'react';

type Props = {
    children: ReactNode;
};

export default ({children}: Props) => {
    return (
        <div className='mashroom-portal-ui-form-cell'>
            {children}
        </div>
    );
};
