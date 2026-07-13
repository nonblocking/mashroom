
# Test Server 7

A test server is similar to Test Server 1, but all config files are written in TypeScript.

If the Node.js version is <= 24 *ts-blank-spaceÜ is automatically installed to load TypeScript modules.

It contains two test plugins:

 * test-plugin1: Written in TypeScript without any transpilation, config file also in TypeScript
 * test-plugin2: Written in ES6 with any transpilation, config file in YAML

# Start Locally

    npm start

Open http://localhost:5050 and http://localhost:5050/portal for the Portal

Predefined users: john/john, admin/admin

The Demo Webapp in /test-plugin1 will be available at http://localhost:5050/test-webapp-ts-config
