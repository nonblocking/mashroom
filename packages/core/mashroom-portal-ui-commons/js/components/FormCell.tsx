
import React, {PureComponent} from 'react';

import type {ReactNode} from 'react';

type Props = {
    children: ReactNode;
};

export default class FormCell extends PureComponent<Props> {

    render(): ReactNode {
        return (
            <div className='mashroom-portal-ui-form-cell'>
                {this.props.children}
            </div>
        );
    }

}
