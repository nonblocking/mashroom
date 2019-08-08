// @flow

import React, {PureComponent} from 'react';
import {
    Form,
    TextFieldContainer,
    SourceCodeEditorFieldContainer,
    Button
} from '@mashroom/mashroom-portal-ui-commons';
import {mergeAppConfig} from '../utils';

import type {SelectedPortalApp} from '../../../type-definitions';

type Props = {
    hostWidth: string,
    selectedPortalApp: ?SelectedPortalApp,
    onConfigSubmit: (SelectedPortalApp, string) => void,
}

export default class PortalAppConfig extends PureComponent<Props> {

    getInitialValues() {
        const { selectedPortalApp, hostWidth: width } = this.props;
        if (!selectedPortalApp) {
            return null;
        }
        const { setup: { lang, user: { permissions }, appConfig } } = selectedPortalApp;

        return {
            lang,
            width,
            permissions: JSON.stringify(permissions, null, 2),
            appConfig: JSON.stringify(appConfig, null, 2)
        };
    }

    validate(values: Object) {
        const errors = {};
        const { permissions, appConfig } = values;

        try {
            JSON.parse(permissions);
        } catch (e) {
            errors.permissions = 'errorInvalidJSON';
        }
        try {
            JSON.parse(appConfig);
        } catch (e) {
            errors.appConfig = 'errorInvalidJSON';
        }

        return errors;
    }

    onSubmit(values: any) {
        const { selectedPortalApp, onConfigSubmit } = this.props;
        if (!selectedPortalApp) {
            return;
        }

        const { appName }= selectedPortalApp;
        const { lang, permissions: permissionsStr, appConfig: appConfigStr, width } = values;
        const permissions = JSON.parse(permissionsStr);
        const appConfig = JSON.parse(appConfigStr);

        onConfigSubmit(mergeAppConfig(selectedPortalApp, {
            appName,
            width,
            lang,
            permissions,
            appConfig
        }),  width);
    }

    render() {
        const { selectedPortalApp } = this.props;
        if (!selectedPortalApp) {
            return null;
        }

        return (
            <Form formId='mashroom-sandbox-app-config-form' initialValues={this.getInitialValues()} onSubmit={this.onSubmit.bind(this)} validator={this.validate.bind(this)}>
                <div className='mashroom-sandbox-app-form-row'>
                    <TextFieldContainer id='mashroom-sandbox-app-config-width' name='width' labelId='width' maxLength={10} />
                </div>
                <div className='mashroom-sandbox-app-form-row'>
                    <TextFieldContainer id='mashroom-sandbox-app-config-lang' name='lang' labelId='lang' maxLength={2} />
                </div>
                <div className='mashroom-sandbox-app-form-row'>
                    <SourceCodeEditorFieldContainer name='permissions' labelId='permissions' language='json' theme='idea' height={120} />
                </div>
                <div className='mashroom-sandbox-app-form-row'>
                    <SourceCodeEditorFieldContainer name='appConfig' labelId='appConfig' language='json' theme='idea' height={120} />
                </div>
                <div>
                    <Button id='mashroom-sandbox-app-load' type='submit' labelId='load'/>
                </div>
            </Form>
        );
    }

}
