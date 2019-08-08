// @flow

import React, {PureComponent} from 'react';
import {Form, SelectFieldContainer} from '@mashroom/mashroom-portal-ui-commons';

import type {MashroomAvailablePortalApp} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    availablePortalApps: Array<MashroomAvailablePortalApp>,
    selectionChanged: (?string) => void,
}

export default class PortalAppSelection extends PureComponent<Props> {

    render() {
        const { availablePortalApps, selectionChanged } = this.props;
        const options = availablePortalApps.map((a) => ({
            value: a.name,
            label: a.name
        }));

        return (
            <div>
                <Form formId='portal-app-selection'>
                    <div className='mashroom-sandbox-app-form-row'>
                        <SelectFieldContainer id='appName' name='appName' labelId='appName' options={options} emptyOption={true} onValueChange={selectionChanged} />
                    </div>
                </Form>
            </div>
        )
    }

}
