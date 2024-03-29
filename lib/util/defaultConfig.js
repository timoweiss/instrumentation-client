'use strict';

module.exports = {
    todo_disabled: !!process.env['TODO_DISABLED'],
    loadavgSampleInterval: process.env['TODO_LOADAVG_SAMPLERATE'] || 3000,
    memorySampleInterval: process.env['TODO_MEMORY_SAMPLERATE'] || 4000,
    reportingInterval: process.env['TODO_REPORTING_INTERVAL'] || 5000,
    app_token: process.env['TODO_APP_TOKEN'] || '',
    service_name: process.env['TODO_SERVICE_NAME'] || 'Service',
    service_id: process.env['TODO_SERVICE_ID'] || '',
    collector_host: process.env['TODO_COLLECTOR_HOST'] || '52.58.175.11',
    collector_port: process.env['TODO_COLLECTOR_PORT'] || 2020,
    collector_options: {
        loadavg: true,
        mem: true,
        requests: true // TODO: maybe fine grain modules
    }
};