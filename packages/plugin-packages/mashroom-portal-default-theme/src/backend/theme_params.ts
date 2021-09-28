
type ThemeParams = {
    spaMode: boolean;
    showPortalAppHeaders: boolean;
    showEnvAndVersions: boolean;
    mashroomVersion: string;
}

let params: ThemeParams = {
    spaMode: true,
    showPortalAppHeaders: true,
    showEnvAndVersions: false,
    mashroomVersion: '',
};

export default {
    get spaMode() {
        return params.spaMode;
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
