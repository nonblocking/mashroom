
type ThemeParams = {
    showEnvAndVersions: boolean;
    mashroomVersion: string;
}

let params: ThemeParams = {
    showEnvAndVersions: false,
    mashroomVersion: '',
};

export default {
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
