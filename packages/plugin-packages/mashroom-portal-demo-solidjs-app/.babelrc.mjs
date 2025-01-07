import presetsBrowser from '../../../build-config/babel.presets.browser.mjs';

export default function (api) {
    api.cache(true);

    return {
        presets: [
            ...presetsBrowser,
            'babel-preset-solid'
        ],
    };
};
