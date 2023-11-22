
import React, {PureComponent} from 'react';
import type {ReactNode} from 'react';

type Props = {
    children: ReactNode;
};

export default class DialogButtons extends PureComponent<Props> {

    render() {
        const {children} = this.props;
        return (
            <div className='mashroom-portal-ui-dialog-buttons'>
                {children}
            </div>
        );
    }

}
