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
            freemem: bytesToMegabytes(os.freemem() / (1024 * 1024)),
            time: microtime.now()
        }),
        startUpInfo: () => ({
            time: microtime.now(),
            cpuCount,
            loadavg: [initLoadavg[0] / cpuCount, initLoadavg[1] / cpuCount, initLoadavg[2] / cpuCount],
            freemem: bytesToMegabytes(os.freemem()),
            totalmem: bytesToMegabytes(os.totalmem()),
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
        time: microtime.now(),
        value: os.loadavg()[0] / cpuCount
    });
}


function collectMemoryUsage() {
    stagingDataMemory.push({
        time: microtime.now(),
        value: convertMemoryUsage(process.memoryUsage())
    });
}

function convertMemoryUsage(usageObject) {
    return {
        rss: bytesToMegabytes(usageObject.rss),
        heapTotal: bytesToMegabytes(usageObject.heapTotal),
        heapUsed: bytesToMegabytes(usageObject.heapUsed)
    }
}

function bytesToMegabytes(bytes) {
    return bytes / 1048576
}