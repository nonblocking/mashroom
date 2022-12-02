
import React, {PureComponent} from 'react';

import type {ReactNode} from 'react';

type Props = {
    striped?: boolean;
    children: ReactNode;
};

export default class TableResponsive extends PureComponent<Props> {

    render(): ReactNode {
        const {striped, children} = this.props;
        return (
            <div className={`mashroom-portal-ui-table-responsive ${striped ? 'table-striped' : ''}`}>
                <table>
                    {children}
                </table>
            </div>
        );
    }

}
