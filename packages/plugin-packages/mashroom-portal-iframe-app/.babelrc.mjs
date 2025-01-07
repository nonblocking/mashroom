import presetsBrowser from '../../../build-config/babel.presets.browser.mjs';

export default function (api) {
    api.cache(true);

    return {
        presets: [
            ...presetsBrowser,
        ],
        plugins: [
            '@babel/plugin-transform-runtime'
        ]
    };
};
