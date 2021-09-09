
import React, {PureComponent, Fragment} from 'react';
import {FormCell, FormRow, SelectFieldContainer} from '@mashroom/mashroom-portal-ui-commons';

import type {ReactNode} from 'react';
import type {AnyPage, FlatPage} from '../types';

type Props = {
    pageId: string | undefined | null;
    pages: Array<FlatPage>;
};

type State = {
    selectedParentPageId: string | undefined | null;
};

export default class PagePositionSelection extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            selectedParentPageId: null
        };
    }

    componentDidMount(): void {
        this.initSelectedParentPageId();
    }

    componentDidUpdate(prevProps: Props): void {
        if (prevProps.pageId !== this.props.pageId) {
            this.initSelectedParentPageId();
        }
    }

    initSelectedParentPageId(): void {
        if (this.props.pageId) {
            const parentPage = this.props.pages.find((p) => p.subPages && p.subPages.find((sp) => sp.pageId === this.props.pageId));
            if (parentPage) {
                this.setState({
                    selectedParentPageId: parentPage.pageId
                });
                return;
            }
        }

        this.setState({
            selectedParentPageId: null
        });
    }

    onSelectedParentPageChange(pageId: string | undefined | null): void {
        this.setState({
            selectedParentPageId: pageId
        });
    }

    render(): ReactNode {
        let parentPageOptions = [{
            value: '',
            label: '<Root>'
        }];
        parentPageOptions = parentPageOptions.concat(this.props.pages
            .filter((pp) => pp.pageId !== this.props.pageId)
            .map((pp) => ({
                value: pp.pageId,
                label: ''.padStart(pp.level * 2, '-') + pp.title
            })));

        let insertAfterOptions = [{
            value: '',
            label: '<Parent>'
        }];

        let subPages: Array<AnyPage> | null | undefined = null;
        if (!this.state.selectedParentPageId) {
            subPages = this.props.pages && this.props.pages.filter((p) => p.level === 0);
        } else {
            const currentParent = this.props.pages.find((p) => p.pageId === this.state.selectedParentPageId);
            if (currentParent) {
                subPages = currentParent.subPages;
            }
        }
        if (subPages) {
            insertAfterOptions = insertAfterOptions.concat(subPages
                .filter((sp) => sp.pageId !== this.props.pageId)
                .map((sp) => ({
                    value: sp.pageId,
                    label: sp.title
                })));
        }

        return (
            <Fragment>
                <FormRow>
                    <FormCell>
                        <SelectFieldContainer id='parentPage' name='position.parentPageId' labelId='parentPage' options={parentPageOptions} onValueChange={this.onSelectedParentPageChange.bind(this)}/>
                    </FormCell>
                </FormRow>
                <FormRow>
                    <FormCell>
                        <SelectFieldContainer id='insertAfter' name='position.insertAfterPageId' labelId='insertAfter' options={insertAfterOptions}/>
                    </FormCell>
                </FormRow>
            </Fragment>
        );
    }
}
