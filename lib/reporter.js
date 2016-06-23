'use strict';

const debug = require('debug')('reporter');

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

const API = {
    report,
    sendStartUpInfo: () => {
        let data = {
            isStartup: true,
            startupInfo: osMetrics.startStopInfo()
        };

        const postData = JSON.stringify(data);

        // defer sending startup info
        setTimeout(() => sendData(ENDPOINTS.ROLLING_STATS, postData), 1000);
    },
    sendShutdownInfo: remainingData => {
        let data = {
            isShutdown: true,
            shutdownInfo: osMetrics.startStopInfo()
        };

        data = Object.assign(data, remainingData || {});

        const postData = JSON.stringify(data);

        sendDataSync(ENDPOINTS.ROLLING_STATS, postData);
    }
};

module.exports = (config) => {

    collector = config.collector;
    osMetrics = config.osm;
    host = config.host || '52.28.117.222';
    app_token = config.app_token;

    if(config.collector.requests) {
        setInterval(report, config.reportingInterval);
    }

    return API
};

function report(sendSync) {

    const data = collector.flush();
    const osdata = osMetrics.flush();
    const reportingData = {
        requests: data,
        osdata: osdata
    };

    if(sendSync) {
        return API.sendShutdownInfo(reportingData);
    }

    if (Object.keys(reportingData.requests).length === 0 && Object.keys(reportingData.osdata).length === 0) {
        debug('noting to report, returning');
        return;
    }

    const postData = JSON.stringify(reportingData);

    sendData(ENDPOINTS.ROLLING_STATS, postData);


}

function sendData(endpoint, data) {

    const request = http.request({
        hostname: host,
        port: 2020,
        method: 'POST',
        path: endpoint,
        headers: {
            'Authorization': ' Bearer ' + app_token,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }, function (res) {

        debug(`STATUS: ${res.statusCode}`);
        debug(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            debug(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            debug('No more data in response.')
        })
    });

    request.on('error', (e) => {
        debug(`problem with request: ${e.message}`);
    });

    // write data to request body
    request.write(data);
    request.end();

}

function sendDataSync(endpoint, data) {
    let port = 2020;
    let url = 'http://' + host + ':' + port + endpoint;

    debug('sending sync:', data);
    try {

        let response = syncRequest('POST', url, {
            json: data,
            timeout: 1000,
            headers: {
                'Authorization': ' Bearer ' + app_token,
                'Content-Type': 'application/json'
            }
        });
        debug('sending sync rsp', response.body.toString());
    } catch (e) {
        console.error('err sending sync:', e);
    }

}