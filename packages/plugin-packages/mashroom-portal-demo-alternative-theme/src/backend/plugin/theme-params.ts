
type ThemeParams = {
    mashroomVersion: string;
}

let params: ThemeParams = {
    mashroomVersion: '',
};

export default {
    get mashroomVersion() {
        return params.mashroomVersion;
    },
    setParams(_params: ThemeParams) {
        params = _params;
    },
};
