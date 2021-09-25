
type ThemeParams = {
    showPortalAppHeaders: boolean;
    showEnvAndVersions: boolean;
    mashroomVersion: string;
}

let params: ThemeParams = {
    showPortalAppHeaders: true,
    showEnvAndVersions: false,
    mashroomVersion: '',
};

export default {
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
