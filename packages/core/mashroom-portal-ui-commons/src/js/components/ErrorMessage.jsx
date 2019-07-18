// @flow

import React, {PureComponent} from 'react';

import type {Node} from 'React';

type Props = {
    children: Node,
};

export default class ErrorMessage extends PureComponent<Props> {

    render() {
        return (
            <div className='mashroom-portal-ui-error-message'>
                {this.props.children}
            </div>
        );
    }

}
