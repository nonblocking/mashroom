// @flow

import React, {PureComponent} from 'react';

import type {Node} from 'React';

type Props = {
    children: Node,
};

export default class TableResponsive extends PureComponent<Props> {

    render() {
        return (
            <div className='mashroom-portal-ui-table-responsive'>
                <table>
                    {this.props.children}
                </table>
            </div>
        );
    }

}
