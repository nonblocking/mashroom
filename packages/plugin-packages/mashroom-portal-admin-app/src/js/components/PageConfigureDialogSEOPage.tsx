import React from 'react';
import {DialogContent, FormCell, FormRow, TextareaField, TextField} from '@mashroom/mashroom-portal-ui-commons';

export default () => (
    <DialogContent>
        <FormRow>
            <FormCell>
                <TextField id='keywords' name='page.keywords' labelId='keywords'/>
            </FormCell>
        </FormRow>
        <FormRow>
            <FormCell>
                <TextareaField id='description' name='page.description' labelId='description' rows={5}/>
            </FormCell>
        </FormRow>
    </DialogContent>
);
