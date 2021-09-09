
import React, {PureComponent} from 'react';

import type {ReactNode} from 'react';

type Props = {
    children: ReactNode;
};

export default class TableResponsive extends PureComponent<Props> {

    render(): ReactNode {
        return (
            <div className='mashroom-portal-ui-table-responsive'>
                <table>
                    {this.props.children}
                </table>
            </div>
        );
    }

}
