import React from 'react';
import {useTranslation} from 'react-i18next';
import {DialogContent, FieldLabel, FormCell, FormRow, SourceCodeEditorField} from '@mashroom/mashroom-portal-ui-commons';
import type {SelectedPortalApp} from '../types';

type Props = {
    selectedPortalApp: SelectedPortalApp | undefined | null;
}

export default ({selectedPortalApp}: Props) => {
    const {t} = useTranslation();

    let appConfigEditor;
    if (!selectedPortalApp?.customConfigEditor) {
        appConfigEditor = (
            <SourceCodeEditorField id='appConfig' labelId='appConfig' name='appConfig' language='json' theme='dark' />
        );
    } else {
        appConfigEditor = t('hintCustomConfigEditor');
    }

    return (
        <DialogContent>
            <FormRow>
                <FormCell>
                    <FieldLabel labelId='portalAppName'/>
                    {selectedPortalApp?.portalAppName || ''}
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <FieldLabel labelId='portalAppInstanceId'/>
                    {selectedPortalApp?.instanceId || t('none', '<none>')}
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    {appConfigEditor}
                </FormCell>
            </FormRow>
        </DialogContent>
    );
};
