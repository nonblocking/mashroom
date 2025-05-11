import React from 'react';
import {DialogContent, FormCell, FormRow, SelectField, SourceCodeEditorField} from '@mashroom/mashroom-portal-ui-commons';
import type {MashroomAvailablePortalLayout, MashroomAvailablePortalTheme} from '@mashroom/mashroom-portal/type-definitions';
import type {SelectFieldOptions} from '@mashroom/mashroom-portal-ui-commons/type-definitions';

type Props = {
    availableThemes: Array<MashroomAvailablePortalTheme>;
    availableLayouts: Array<MashroomAvailablePortalLayout>;
}

export default ({availableThemes, availableLayouts}: Props) => {
    let availableThemesOptions: SelectFieldOptions = [{ value: '', label: '<Site Default>' }]; // Use empty string for default
    availableThemesOptions = availableThemesOptions.concat(availableThemes.map((theme) => ({
        value: theme.name,
        label: theme.name
    })));
    let availableLayoutsOptions: SelectFieldOptions = [{ value: '', label: '<Site Default>' }]; // Use empty string for default
    availableLayoutsOptions = availableLayoutsOptions.concat(availableLayouts.map((layout) => ({
        value: layout.name,
        label: layout.name
    })));

    return (
        <DialogContent>
            <FormRow>
                <FormCell>
                    <SelectField id='theme' name='page.theme' labelId='theme' options={availableThemesOptions}/>
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <SelectField id='layout' name='page.layout' labelId='layout' options={availableLayoutsOptions}/>
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <SourceCodeEditorField id='extraCss' labelId='extraCss' name='page.extraCss' language='css' theme='dark' />
                </FormCell>
            </FormRow>
        </DialogContent>
    );
};
