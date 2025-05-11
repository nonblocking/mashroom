import React, {useCallback, useMemo} from 'react'; // Removed PureComponent
import {
    Form,
    TextField,
    SourceCodeEditorField,
    Button,
    TextareaField,
} from '@mashroom/mashroom-portal-ui-commons';
import {useSelector} from 'react-redux';
import { mergeAppConfig } from '../utils';

import type {SelectedPortalApp, State} from '../types';

type FormData = {
    lang: string;
    width: string;
    permissions: string;
    appConfig: string;
}

type Props = {
    sbAutoTest: boolean;
    onConfigSubmit: (app: SelectedPortalApp, width: string) => void,
}

export default ({sbAutoTest, onConfigSubmit}: Props) => {
    const {selectedPortalApp, appLoadingError, host: {width: hostWidth}} = useSelector((state: State) => state);

    const initialValues = useMemo((): FormData | null => {
        if (!selectedPortalApp) {
            return null;
        }
        const { setup: { lang, user: { permissions }, appConfig } } = selectedPortalApp;

        return {
            lang,
            width: hostWidth,
            permissions: JSON.stringify(permissions, null, 2),
            appConfig: JSON.stringify(appConfig, null, 2)
        };
    }, [selectedPortalApp]);

    const validateForm = useCallback((values: FormData) => {
        const errors: { [k in keyof FormData]?: string } = {};
        const { permissions, appConfig } = values;

        try {
            JSON.parse(permissions);
        } catch {
            errors.permissions = 'errorInvalidJSON';
        }
        try {
            JSON.parse(appConfig);
        } catch {
            errors.appConfig = 'errorInvalidJSON';
        }

        return errors;
    }, []);

    const handleSubmit = useCallback((values: FormData): void => {
        // Uses selectedPortalApp and onConfigSubmit from destructured props
        if (!selectedPortalApp) {
            return;
        }

        const { appName } = selectedPortalApp;
        const { lang, permissions: permissionsStr, appConfig: appConfigStr, width } = values;
        const permissions = JSON.parse(permissionsStr);
        const appConfig = JSON.parse(appConfigStr);

        onConfigSubmit(mergeAppConfig(selectedPortalApp, {
            appName,
            width,
            lang,
            permissions,
            appConfig
        }), width);
    }, [selectedPortalApp, onConfigSubmit]);

    if (!selectedPortalApp || appLoadingError) {
        return null;
    }

    return (
        <Form
            formId='mashroom-sandbox-app-config-form'
            initialValues={initialValues}
            onSubmit={handleSubmit}
            validator={validateForm}
        >
            <div className='mashroom-sandbox-app-form-row'>
                <TextField id='mashroom-sandbox-app-config-width' name='width' labelId='width' maxLength={10} />
            </div>
            <div className='mashroom-sandbox-app-form-row'>
                <TextField id='mashroom-sandbox-app-config-lang' name='lang' labelId='lang' maxLength={2} />
            </div>
            <div className='mashroom-sandbox-app-form-row'>
                {!sbAutoTest && <SourceCodeEditorField id='mashroom-sandbox-app-config-permissions' name='permissions' labelId='permissions' language='json' theme='light' height={120} />}
                {sbAutoTest && <TextareaField id='mashroom-sandbox-app-config-permissions' name="permissions" labelId='permissions' />}
            </div>
            <div className='mashroom-sandbox-app-form-row'>
                {!sbAutoTest && <SourceCodeEditorField id='mashroom-sandbox-app-config-app-config' name='appConfig' labelId='appConfig' language='json' theme='light' height={120} />}
                {sbAutoTest && <TextareaField id='mashroom-sandbox-app-config-app-config' name="appConfig" labelId='appConfig' />}
            </div>
            <div>
                <Button id='mashroom-sandbox-app-load' type='submit' labelId='load' />
            </div>
        </Form>
    );
};
