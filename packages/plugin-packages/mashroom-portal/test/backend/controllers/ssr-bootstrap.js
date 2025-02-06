
var bootstrap = function bootstrap(portalAppSetup) {
    return Promise.resolve({
        html: '<p>server side rendered html</p>',
        injectHeadScript: 'alert("foo")'
    });
};

exports.default = bootstrap;
