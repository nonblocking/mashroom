// @flow

import React, {PureComponent} from 'react';

import type {Node} from 'React';

type Props = {
    children: Node,
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
