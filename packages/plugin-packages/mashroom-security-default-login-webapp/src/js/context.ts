
let _pageTitle = 'Mashroom Server';
let _loginFormTitle = 'login';
let _styleFile = '';
let _indexPage = '/';

export default {
    get pageTitle() {
        return _pageTitle;
    },
    get loginFormTitle() {
        return _loginFormTitle;
    },
    get styleFile() {
        return _styleFile;
    },
    get indexPage() {
        return _indexPage;
    },
    set pageTitle(title: string) {
        _pageTitle = title;
    },
    set loginFormTitle(title: string) {
        _loginFormTitle = title;
    },
    set styleFile(path: string) {
        _styleFile = path;
    },
    set indexPage(url: string) {
        _indexPage = url;
    },
};
