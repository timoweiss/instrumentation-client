'use strict';

const http = require('http');
const syncRequest = require('sync-request');

const options = {};
let collector = {};
let osMetrics = {};
let app_token = '';
let host = '';

const ENDPOINTS = {
    ROLLING_STATS: '/metrics',
    STARTUP_STATS: '/metrics/appstart'
};

module.exports = (config) => {

    collector = config.collector;
    osMetrics = config.osm;
    host = config.host;
    app_token = config.app_token;

    setInterval(report, 10000);

    return {
        report,
        sendStartUpInfo: () => {
            const postData = JSON.stringify(osMetrics.startUpInfo());
            // defer sending startup info
            setTimeout(() => sendData(ENDPOINTS.STARTUP_STATS, postData), 1000);
        }
    }
};

function report(sendSync) {

    const data = collector.flush();
    const osdata = osMetrics.flush();
    const reportingData = {
        requests: data,
        osdata: osdata
    };

    if (Object.keys(reportingData.requests).length === 0 && Object.keys(reportingData.osdata).length === 0) {
        console.log('noting to report, returning');
        return;
    }

    const postData = JSON.stringify(reportingData);

    if(!sendSync) {
        sendData(ENDPOINTS.ROLLING_STATS, postData);
    } else {
        sendDataSync(ENDPOINTS.ROLLING_STATS, postData);
    }


}

function sendData(endpoint, data) {
    console.time('E2E time sending metrics');
    const request = http.request({
        hostname: host || '52.58.50.119' ,
        port: 2020,
        method: 'POST',
        path: endpoint,
        headers: {
            'Authorization':' Bearer ' + app_token,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }, function (res) {

        console.timeEnd('E2E time sending metrics');
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.')
        })
    });

    request.on('error', (e) => {

        console.timeEnd('E2E time sending metrics');
        console.log(`problem with request: ${e.message}`);
    });

    // write data to request body
    request.write(data);
    request.end();

}

function sendDataSync(endpoint, data) {
    let port = 2020;
    let url = 'http://' + host + ':' + port + endpoint;

    console.log('sending sync:', data);

    let response = syncRequest('POST', url, {
        json: data,
        timeout: 1000,
        headers: {
            'Authorization':' Bearer ' + app_token,
            // 'Content-Type': 'application/json'
        }
    });
    console.log('sending sync rsp', response.getBody())

}