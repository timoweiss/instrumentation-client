'use strict';

const http = require('http');

const options = {};
let collector = {};
let osMetrics = {};
let app_token = '';

module.exports = (config) => {
    options.reportingEndpoint = '/metrics' //' + config.application_id + '/' + config.service_name;

    collector = config.collector;
    osMetrics = config.osm;
    app_token = config.app_token;

    setInterval(report, 10000);

    return {
        report,
        sendStartUpInfo: () => {
            const postData = JSON.stringify(osMetrics.startUpInfo());
            // defer sending startup info
            setTimeout(() => sendData(options.reportingEndpoint, postData), 1000);
        }
    }
};

function report() {

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

    sendData(options.reportingEndpoint, postData);


}

function sendData(endpoint, data) {

    const request = http.request({
        hostname: 'localhost',
        port: 2020,
        method: 'POST',
        path: endpoint,
        headers: {
            'Authorization':' Bearer ' + app_token,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }, function (res) {
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
        console.log(`problem with request: ${e.message}`);
    });

    // write data to request body
    request.write(data);
    request.end();

}