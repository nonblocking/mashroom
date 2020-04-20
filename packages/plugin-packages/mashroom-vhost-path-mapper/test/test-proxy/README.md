
# Test Reverse Proxy

Starts a reverse proxy that forwards *http://localhost:8888/mashroom-portal* to the default site of the Portal (/portal/web).

## Usage

    cd  <repo-root>/packages/test/test-server1
    npm install
    npm start

    cd <this folder>
    ./start.sh

This works because of the virtual host mapping configuration in *<repo-root>/packages/test/test-server1/mashroom.json*:

```json
"Mashroom VHost Path Mapper Middleware": {
    "hosts": {
       "localhost:8888": {
          "frontendBasePath": "/mashroom-portal",
          "mapping": {
             "/login": "/login",
             "/": "/portal/web"
          }
       }
    }
}
```
