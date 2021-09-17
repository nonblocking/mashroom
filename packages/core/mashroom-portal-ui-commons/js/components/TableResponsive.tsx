
import React, {PureComponent} from 'react';

import type {ReactNode} from 'react';

type Props = {
    children: ReactNode;
};

export default class TableResponsive extends PureComponent<Props> {

    render(): ReactNode {
        const {children} = this.props;
        return (
            <div className='mashroom-portal-ui-table-responsive'>
                <table>
                    {children}
                </table>
            </div>
        );
    }

}
