
import React from 'react';

import type {ReactNode} from 'react';

type Props = {
    striped?: boolean;
    children: ReactNode;
};

export default ({striped, children}: Props) => {
    return (
        <div className='mashroom-portal-ui-table-responsive'>
            <table className={`${striped ? 'table-striped' : ''}`}>
                {children}
            </table>
        </div>
    );
};
