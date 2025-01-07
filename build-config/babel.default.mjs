
export default function (api) {
  api.cache(true);

  const presets = [
    [
      "@babel/preset-env", {
        "targets": {
          "node": "18"
        }
      },
    ],
    "@babel/preset-typescript"
  ];

  return {
    presets,
  };
};
