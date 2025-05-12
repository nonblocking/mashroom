import React from 'react';
import {CheckboxField, DialogContent, FormCell, FormRow, TextField} from '@mashroom/mashroom-portal-ui-commons';
import I18NStringField from './I18NStringField';
import PagePositionSelection from './PagePositionSelection';
import type {Pages, SelectedPage} from '../types';

type Props = {
    selectedPage: SelectedPage | undefined | null;
    pages: Pages;
};

export default ({selectedPage, pages}: Props) => {
    if (!selectedPage) return null;
    return (
        <DialogContent>
            <FormRow>
                <FormCell>
                    <I18NStringField id='title' name='page.title' labelId='title' />
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <TextField id='friendlyUrl' name='page.friendlyUrl' labelId='friendlyUrl' />
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <CheckboxField id='clientSideRouting' name='page.clientSideRouting' labelId='clientSideRouting'/>
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <CheckboxField id='hidden' name='page.hidden' labelId='hideInNavigation'/>
                </FormCell>
            </FormRow>
            <PagePositionSelection selectedPageId={selectedPage.pageId} pages={pages.pagesFlattened}/>
        </DialogContent>
    );
};
