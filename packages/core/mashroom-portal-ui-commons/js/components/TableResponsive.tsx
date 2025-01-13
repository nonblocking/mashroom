
import React, {PureComponent} from 'react';

import type {ReactNode} from 'react';

type Props = {
    striped?: boolean;
    children: ReactNode;
};

export default class TableResponsive extends PureComponent<Props> {

    render() {
        const {striped, children} = this.props;
        return (
            <div className='mashroom-portal-ui-table-responsive'>
                <table className={`${striped ? 'table-striped' : ''}`}>
                    {children}
                </table>
            </div>
        );
    }

}
