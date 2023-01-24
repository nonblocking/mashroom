
import React from 'react';
import {useFormikContext} from 'formik';
import {FormCell, FormRow, SelectField} from '@mashroom/mashroom-portal-ui-commons';

import type {PagePosition,AnyPage, FlatPage} from '../types';

type Props = {
    selectedPageId: string | undefined | null;
    pages: Array<FlatPage>;
};

export default ({selectedPageId, pages}: Props) => {
    const { values } = useFormikContext<{ position: PagePosition }>();
    const { position } = values;

    let parentPageOptions = [{
        value: '',
        label: '<Root>'
    }];
    parentPageOptions = parentPageOptions.concat(pages
        .filter((pp) => pp.pageId !== selectedPageId)
        .map((pp) => ({
            value: pp.pageId,
            label: `${''.padStart(pp.level, '-')} ${pp.title}`
        })));

    let insertAfterOptions = [{
        value: '',
        label: '<Parent>'
    }];

    let subPages: Array<AnyPage> | null | undefined = null;
    if (!position.parentPageId) {
        subPages = pages?.filter((p) => p.level === 0);
    } else {
        const currentParent = pages.find((p) => p.pageId === position.parentPageId);
        if (currentParent) {
            subPages = currentParent.subPages;
        }
    }
    if (subPages) {
        insertAfterOptions = insertAfterOptions.concat(subPages
            .filter((sp) => sp.pageId !== selectedPageId)
            .map((sp) => ({
                value: sp.pageId,
                label: sp.title
            })));
    }

    return (
        <>
            <FormRow>
                <FormCell>
                    <SelectField id='parentPage' name='position.parentPageId' labelId='parentPage' options={parentPageOptions} />
                </FormCell>
            </FormRow>
            <FormRow>
                <FormCell>
                    <SelectField id='insertAfter' name='position.insertAfterPageId' labelId='insertAfter' options={insertAfterOptions} />
                </FormCell>
            </FormRow>
        </>
    );
};
