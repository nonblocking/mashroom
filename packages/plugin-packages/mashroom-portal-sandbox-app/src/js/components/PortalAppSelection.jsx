// @flow

import React, {PureComponent} from 'react';
import {Form, SelectFieldContainer, ErrorMessage} from '@mashroom/mashroom-portal-ui-commons';

import type {MashroomAvailablePortalApp} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    preselectAppName: ?string,
    availablePortalApps: Array<MashroomAvailablePortalApp>,
    appLoadingError: boolean,
    onSelectionChanged: (?string) => void,
}

export default class PortalAppSelection extends PureComponent<Props> {

    getInitialValues() {
        const { preselectAppName } = this.props;
        return {
            appName: preselectAppName,
        }
    }

    render() {
        const { availablePortalApps, onSelectionChanged, appLoadingError } = this.props;
        const options = availablePortalApps.map((a) => ({
            value: a.name,
            label: a.name
        }));

        return (
            <div>
                <Form formId='portal-app-selection' initialValues={this.getInitialValues()}>
                    <div className='mashroom-sandbox-app-form-row'>
                        <SelectFieldContainer id='appName' name='appName' labelId='appName' options={options} emptyOption={true} onValueChange={onSelectionChanged} />
                    </div>
                    {appLoadingError && (
                        <div className='app-loading-error'>
                            <ErrorMessage messageId='errorLoadingApp' />
                        </div>
                    )}
                </Form>
            </div>
        )
    }

}
