
import React, {PureComponent} from 'react';

import type {ReactNode} from 'react';

type Props = {
    children: ReactNode;
};

export default class FormRow extends PureComponent<Props> {

    render() {
        const {children} = this.props;
        const cellCount = React.Children.count(children);

        let cellClass = '';
        switch (cellCount) {
            case 1:
                cellClass = 'one-cell';
                break;
            case 2:
                cellClass = 'two-cells';
                break;
            case 3:
                cellClass = 'three-cells';
                break;
            default:
        }

        return (
            <div className={`mashroom-portal-ui-form-row ${cellClass}`}>
                {children}
            </div>
        );
    }

}
