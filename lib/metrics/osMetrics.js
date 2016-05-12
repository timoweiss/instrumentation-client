'use strict';

const os = require('os');
const microtime = require('microtime');


let stagingDataLoad = [];
let stagingDataMemory = [];
const cpuCount = os.cpus().length;


module.exports = config => {
    setInterval(collectLoadavg, config.loadavgSampleInterval);
    setInterval(collectMemoryUsage, config.memorySampleInterval);

    const initLoadavg = os.loadavg();

    return {
        flush: () => ({
            loadavg: stagingDataLoad.splice(0),
            memory: stagingDataMemory.splice(0),
            freemem: os.freemem()
        }),
        startUpInfo: () => ({
            timestamp: microtime.now(),
            cpuCount,
            loadavg: [initLoadavg[0] / cpuCount, initLoadavg[1] / cpuCount, initLoadavg[2] / cpuCount],
            freemem: os.freemem(),
            totalmem: os.totalmem(),
            uptime: os.uptime(),
            platform: process.platform,
            version: process.version,
            pid: process.pid,
            cwd: process.cwd()

        })
    }
};

function collectLoadavg() {
    stagingDataLoad.push({
        timestamp: microtime.now(),
        value: os.loadavg()[0] / cpuCount
    });
}


function collectMemoryUsage() {
    stagingDataMemory.push({
        timestamp: microtime.now(),
        value: process.memoryUsage()
    });
}