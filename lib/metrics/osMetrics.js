'use strict';

const os = require('os');
const microtime = require('microtime');


let stagingDataLoad = [];
let stagingDataMemory = [];
const cpuCount = os.cpus().length;


module.exports = config => {
    setInterval(collectLoadavg, config.loadavgSampleInterval);
    setInterval(collectMemoryUsage, config.memorySampleInterval);

    return {
        flush: () => ({
            loadavg: stagingDataLoad.splice(0),
            memory: stagingDataMemory.splice(0)
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