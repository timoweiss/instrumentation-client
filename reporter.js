'use strict';

const http = require('http');

const options = {};
let collector = {};

module.exports = function reporter(config, _collector) {
    options.reportingEndpoint = '/report/' + config.application_id + '/' + config.service_name

    collector = _collector;

    setInterval(report, 25000);

    return {
        report
    }
};

function report() {

    const data = collector.flush();

    if (!data.inRequest.length && !data.outRequest.length && !data.outResponse.length && !data.inResponse.length) {
        console.log('noting to report, returning');
        return;
    }

    const postData = JSON.stringify(data);

    const request = http.request({
        hostname: 'localhost',
        port: 2020,
        method: 'POST',
        path: options.reportingEndpoint
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
    request.write(postData);
    request.end();
}
