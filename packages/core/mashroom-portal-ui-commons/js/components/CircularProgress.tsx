
import React, {PureComponent} from 'react';
import type {ReactNode} from 'react';

type Props = Record<string, never>;

export default class CircularProgress extends PureComponent<Props> {

    render(): ReactNode {
        return (
            <div className='mashroom-portal-ui-circular-progress'>
                <span/>
            </div>
        );
    }
}
