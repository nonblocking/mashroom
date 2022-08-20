
import React, {PureComponent} from 'react';
import {
    Form,
    TextField,
    SourceCodeEditorField,
    Button
} from '@mashroom/mashroom-portal-ui-commons';
import {mergeAppConfig} from '../utils';

import type {ReactNode} from 'react';
import type {SelectedPortalApp} from '../types';

type FormData = {
    lang: string;
    width: string;
    permissions: string;
    appConfig: string;
}

type Props = {
    hostWidth: string;
    selectedPortalApp: SelectedPortalApp | undefined | null;
    appLoadingError: boolean;
    onConfigSubmit: (app: SelectedPortalApp, width: string) => void,
}

export default class PortalAppConfig extends PureComponent<Props> {

    getInitialValues(): FormData | null {
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

    validate(values: FormData): any {
        const errors: { [k in keyof FormData]?: string } = {};
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

    onSubmit(values: FormData): void {
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

    render(): ReactNode {
        const { selectedPortalApp, appLoadingError } = this.props;
        if (!selectedPortalApp || appLoadingError) {
            return null;
        }

        return (
            <Form formId='mashroom-sandbox-app-config-form' initialValues={this.getInitialValues()} onSubmit={this.onSubmit.bind(this)} validator={this.validate.bind(this)}>
                <div className='mashroom-sandbox-app-form-row'>
                    <TextField id='mashroom-sandbox-app-config-width' name='width' labelId='width' maxLength={10} />
                </div>
                <div className='mashroom-sandbox-app-form-row'>
                    <TextField id='mashroom-sandbox-app-config-lang' name='lang' labelId='lang' maxLength={2} />
                </div>
                <div className='mashroom-sandbox-app-form-row'>
                    <SourceCodeEditorField id='mashroom-sandbox-app-config-permissions'  name='permissions' labelId='permissions' language='json' theme='light' height={120} />
                </div>
                <div className='mashroom-sandbox-app-form-row'>
                    <SourceCodeEditorField id='mashroom-sandbox-app-config-app-config'  name='appConfig' labelId='appConfig' language='json' theme='light' height={120} />
                </div>
                <div>
                    <Button id='mashroom-sandbox-app-load' type='submit' labelId='load'/>
                </div>
            </Form>
        );
    }

}
