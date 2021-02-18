
import type {I18NString} from '@mashroom/mashroom/type-definitions';

let loginFormTitle: I18NString = 'Mashroom Server';
let styleFile = '';
let indexPage = '/';

export default {
    get loginFormTitle() {
        return loginFormTitle;
    },
    get styleFile() {
        return styleFile;
    },
    get indexPage() {
        return indexPage;
    },
};

export const setLoginFormTitle = (name: I18NString) => {
    loginFormTitle = name;
};

export const setStyleFile = (path: string) => {
    styleFile = path;
};

export const setIndexPage = (page: string) => {
    indexPage = page;
};
