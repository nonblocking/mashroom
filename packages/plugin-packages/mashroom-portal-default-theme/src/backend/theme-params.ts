
type ThemeParams = {
    spaMode: boolean;
    darkMode: true | false | 'auto';
    styleFile: string | null;
    showPortalAppHeaders: boolean;
    showEnvAndVersions: boolean;
    mashroomVersion: string;
}

let params: ThemeParams = {
    spaMode: true,
    darkMode: false,
    styleFile: null,
    showPortalAppHeaders: true,
    showEnvAndVersions: false,
    mashroomVersion: '',
};

export default {
    get spaMode() {
        return params.spaMode;
    },
    get darkMode() {
        return params.darkMode;
    },
    get styleFile() {
        return params.styleFile;
    },
    get showPortalAppHeaders() {
        return params.showPortalAppHeaders;
    },
    get showEnvAndVersions() {
        return params.showEnvAndVersions;
    },
    get mashroomVersion() {
        return params.mashroomVersion;
    },
    setParams(_params: ThemeParams) {
        params = _params;
    },
};
