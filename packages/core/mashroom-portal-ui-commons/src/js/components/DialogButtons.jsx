// @flow

import React, {PureComponent} from 'react';

import type {Node} from 'React';

type Props = {
    children: Node,
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
