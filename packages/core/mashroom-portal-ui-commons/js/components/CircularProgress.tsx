
import React, {PureComponent} from 'react';

type Props = Record<string, never>;

export default class CircularProgress extends PureComponent<Props> {

    render() {
        return (
            <div className='mashroom-portal-ui-circular-progress'>
                <span/>
            </div>
        );
    }
}
