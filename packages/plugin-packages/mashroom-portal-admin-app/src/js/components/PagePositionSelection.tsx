
import React, {useMemo} from 'react';
import {useFormikContext} from 'formik';
import {FormCell, FormRow, SelectField} from '@mashroom/mashroom-portal-ui-commons';

import type {PagePosition,AnyPage, FlatPage} from '../types';

type Props = {
    selectedPageId: string | undefined | null;
    pages: Array<FlatPage>;
};

export default ({selectedPageId, pages}: Props) => {
    const { values: {position} } = useFormikContext<{ position: PagePosition }>();

    const parentPageOptions = useMemo(() => {
        let parentPageOptions = [{
            value: '',
            label: '<Root>'
        }];
        parentPageOptions = parentPageOptions.concat(
            pages.filter((pp) => pp.pageId !== selectedPageId)
                .map((pp) => ({
                    value: pp.pageId,
                    label: `${''.padStart(pp.level, '-')} ${pp.title}`
                })));
        return parentPageOptions;
    }, [pages, selectedPageId]);

    const insertAfterOptions = useMemo(() => {
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
        return insertAfterOptions;
    }, [pages, selectedPageId, position]);

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
