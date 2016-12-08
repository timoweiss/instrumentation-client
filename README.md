## instrumentation-client

This project is a WIP. Once installed and loaded as the first module in your node application, the instrumentation client collects and sends metrics to a given endpoint.

There is also an [collector-backend available](https://github.com/timoweiss/collector-backend).

Sorry for the sparse information - please raise an issue if you want to know more!


`git clone https://github.com/timoweiss/instrumentation-client.git && cd $_`

`npm i`

`npm link`



### Configuration via process.env

```javascript
module.exports = {
    todo_disabled: !!process.env['TODO_DISABLED'],
    loadavgSampleInterval: process.env['TODO_LOADAVG_SAMPLERATE'] || 2000,
    memorySampleInterval: process.env['TODO_MEMORY_SAMPLERATE'] || 1000,
    app_token: process.env['TODO_APP_TOKEN'] || '',
    service_name: process.env['TODO_SERVICE_NAME'] || 'Service',
    service_id: process.env['TODO_SERVICE_ID'] || '',
    collector_host: process.env['TODO_COLLECTOR_HOST'] || 'localhost',
    collector_port: process.env['TODO_COLLECTOR_PORT'] || 2020,
    collector: {
        loadavg: true,
        mem: true,
        requests: true // TODO: maybe fine grain modules
    }
};
```
