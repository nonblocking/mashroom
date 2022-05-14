
import React, {PureComponent} from 'react';

import type {ReactNode, RefObject, FormEvent} from 'react';
import type {FormikTouched} from 'formik/';
import type {ValidationErrors, FormContext} from '../../type-definitions';

type Props = {
    id: string;
    initialValues: any;
    values: any;
    errors: ValidationErrors;
    handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
    resetForm: () => void;
    setTouched: (touched: FormikTouched<any>) => void;
    setFieldValue: (field: string, value: any) => void;
    onChange?: (values: any, previousValues: any, context: FormContext) => void;
    children: ReactNode;
};

export default class Form extends PureComponent<Props> {

    formRef: RefObject<HTMLFormElement>;

    constructor(props: Props) {
        super(props);
        this.formRef = React.createRef();
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        const {values, initialValues, resetForm, setFieldValue, onChange} = this.props;
        if (prevProps.values !== values) {
            if (onChange) {
                onChange(values, prevProps.values, {
                    resetForm,
                    setFieldValue,
                    initialValues,
                });
            }
        }
    }

    focusFirstErroneousField(): void {
        const {errors} = this.props;
        if (Object.keys(errors).length === 0) {
            return;
        }
        const elements = (this.formRef.current || document).querySelectorAll('input, select, textarea');
        console.info('');
        for (let i = 0; i < elements.length; i++) {
            const elem: any = elements[i];
            if (elem.name) {
                if (errors && this.errorExists(elem.name)) {
                    console.info('Focusing erroneous field: ', elem);
                    elem.focus();
                    // Fire a custom event that is used by the TabDialog to make the tab with the erroneous element visible
                    const event = document.createEvent('Event');
                    event.initEvent('erroneous-field-focused', true, true);
                    elem.dispatchEvent(event);
                    break;
                }
            }
        }
    }

    errorExists(path: string): boolean {
        const {errors} = this.props;
        const props = path.split('.');
        let parent: any = errors;
        for (const prop of props) {
            parent = parent[prop];
            if (!parent) {
                return false;
            }
        }
        return true;
    }

    getTouchedObj(errors: any) {
        const touched: FormikTouched<any> = {};
        Object.keys(errors).map(key => {
            const errorObj = errors[key];
            if (Array.isArray(errorObj)) {
                errorObj.map((val: any, index: any) => {
                    if (index == 0) {
                        touched[key] = [];
                    }
                    (touched[key] as any).push(this.getTouchedObj(val));
                });
            } else if (typeof (errorObj) === 'string') {
                touched[key] = true;
            } else if (errorObj && typeof (errorObj) === 'object') {
                touched[key] = this.getTouchedObj(errorObj);
            }
        });
        return touched;
    }

    onSubmit(e: FormEvent<HTMLFormElement>) {
        const {handleSubmit, setTouched, errors} = this.props;
        setTimeout(() => {
            setTouched(this.getTouchedObj(errors));
            this.focusFirstErroneousField();
        }, 100);
        handleSubmit(e);
    }

    render(): ReactNode {
        const {id, children} = this.props;
        return (
            <div className='mashroom-portal-ui-form'>
                <form id={id} onSubmit={this.onSubmit.bind(this)} ref={this.formRef}>
                    {children}
                </form>
            </div>
        );
    }

}
