import React from 'react';
import {FormattedMessage} from 'react-intl';
import {DialogContent, FieldLabel, FormCell, FormRow, SourceCodeEditorField} from '@mashroom/mashroom-portal-ui-commons';
import type {SelectedPortalApp} from '../types';

type Props = {
    selectedPortalApp: SelectedPortalApp | undefined | null;
}

export default ({selectedPortalApp}: Props) => {
        let appConfigEditor;
        if (!selectedPortalApp?.customConfigEditor) {
            appConfigEditor = (
                <SourceCodeEditorField id='appConfig' labelId='appConfig' name='appConfig' language='json' theme='dark' />
            );
        } else {
            appConfigEditor = (
                <FormattedMessage id="hintCustomConfigEditor" />
            );
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
                        {selectedPortalApp?.instanceId || <FormattedMessage id='none' defaultMessage='<none>' />}
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
