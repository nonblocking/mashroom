// @flow

import React, {PureComponent} from 'react';

import type {Node} from 'React';

type Props = {
    children: Node,
};

export default class FormCell extends PureComponent<Props> {

    render() {
        return (
            <div className='mashroom-portal-ui-form-cell'>
                {this.props.children}
            </div>
        );
    }

}
