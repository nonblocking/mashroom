const packageJson = require(process.argv[2] +'/package.json');
console.info(`${packageJson.version}-${Date.now()}`);
