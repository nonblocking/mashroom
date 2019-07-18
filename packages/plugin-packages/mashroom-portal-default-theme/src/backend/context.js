// @flow

type Context = {
    showEnvAndVersions: boolean,
    mashroomVersion: string
}

let context: Context = {
    showEnvAndVersions: false,
    mashroomVersion: '',
};


export default {
    get showEnvAndVersions() {
        return context.showEnvAndVersions;
    },
    get mashroomVersion() {
        return context.mashroomVersion;
    },
    setContext(_context: Context) {
        context = _context;
    },
};
