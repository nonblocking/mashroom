import React from 'react';
import {DialogContent, FormCell, FormRow, SelectField, TextField} from '@mashroom/mashroom-portal-ui-commons';
import I18NStringField from './I18NStringField';
import type {SelectFieldOptions} from '@mashroom/mashroom-portal-ui-commons/type-definitions';
import type {MashroomAvailablePortalLayout, MashroomAvailablePortalTheme} from '@mashroom/mashroom-portal/type-definitions';

type Props = {
    availableThemes: Array<MashroomAvailablePortalTheme>;
    availableLayouts: Array<MashroomAvailablePortalLayout>;
}

export default ({availableThemes, availableLayouts}: Props) => {
    let themesOptions: SelectFieldOptions = [{ value: '', label: '<Server Default>' }];
    themesOptions = themesOptions.concat(availableThemes.map((theme) => ({ value: theme.name, label: theme.name })));
    let layoutsOptions: SelectFieldOptions = [{ value: '', label: '<Server Default>' }];
    layoutsOptions = layoutsOptions.concat(availableLayouts.map((layout) => ({ value: layout.name, label: layout.name })));

    return (
        <DialogContent>
            <FormRow>
                <FormCell>
                    <I18NStringField id='title' name='site.title' labelId='title'/>
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <TextField id='path' name='site.path' labelId='path'/>
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <SelectField id='defaultTheme' name='site.defaultTheme' labelId='defaultTheme' options={themesOptions}/>
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <SelectField id='defaultLayout' name='site.defaultLayout' labelId='defaultLayout' options={layoutsOptions}/>
                </FormCell>
            </FormRow>
        </DialogContent>
    );
};
