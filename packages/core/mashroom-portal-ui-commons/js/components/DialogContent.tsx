
import React, {PureComponent} from 'react';

import type {ReactNode} from 'React';

type Props = {
    children: ReactNode;
};

export default class DialogContent extends PureComponent<Props> {

    render() {
        return (
            <div className='mashroom-portal-ui-dialog-content'>
                {this.props.children}
            </div>
        );
    }

}
