
import React, {PureComponent} from 'react';

import type {ReactNode} from 'react';

type Props = {
    children: ReactNode;
};

export default class DialogContent extends PureComponent<Props> {

    render() {
        const {children} = this.props;
        return (
            <div className='mashroom-portal-ui-dialog-content'>
                {children}
            </div>
        );
    }

}
