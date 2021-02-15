
import React, {PureComponent} from 'react';

import type {ReactNode} from 'React';

type Props = {
    children: ReactNode;
};

export default class DialogButtons extends PureComponent<Props> {

    render() {
        return (
            <div className='mashroom-portal-ui-dialog-buttons'>
                {this.props.children}
            </div>
        );
    }

}
