'use strict';

var shimmer = require('shimmer');
const util = require('util');
const url = require('url');
const dbug = require('debug');
const debugMain = dbug('main');
const debugRxReq = dbug('receiving-request');
const debugTxRes = dbug('sending-response');
const debugTxReq = dbug('sending-request');
const debugRxRes = dbug('receiving-response');

const BLACKLIST_PATHS = ['/act', '/metrics', '/metrics/appstart'];
const BLACKLIST_IPS = ['52.58.50.119'];


module.exports = function (http, agent, collector, transactionHelper) {
    debugMain('wrapping httpInstance');


    shimmer.wrap(http, 'request', function (orig, name) {
        return function () {

            // client send

            let requestOptions = arguments[0];

            if(typeof requestOptions === 'string')
                requestOptions = url.parse(requestOptions);

            let path = requestOptions.path;
            let hostname = requestOptions.hostname;
            let href = requestOptions.href;


            if(BLACKLIST_PATHS.indexOf(path) > -1 || BLACKLIST_IPS.indexOf(hostname) > -1) {
                console.log('blacklisting:', path, hostname);
                return orig.apply(this, arguments);
            }


            // console.log('hostname for request is', hostname);

            if (hostname === '52.58.50.119') {
                // debugMain('rejecting own host');
                return orig.apply(this, arguments);
            } else {
                // debugMain('not rejecting outgoing request')
            }
            const timeStart = agent.whatTimeIsIt();

            // generate always new span id when sending new request
            const spanId = transactionHelper.generateRequestId();

            let traceId = transactionHelper.getTraceId();

            if (!traceId) {
                debugMain('looks like there is no traceid available, setting generated spanId to traceId');
                traceId = spanId;
            }



            let parentId = transactionHelper.getRequestId();

            if(!parentId) {
                console.log('CS: There was no parentId available, should be the entrypoint!!!');
            } else {
                console.log('CS: there was something before parent:', parentId)
            }

            debugMain('CS', traceId, spanId);

            collector.reportOutgoingRequest({
                traceId: traceId,
                id: spanId,
                parentId: parentId,
                timestamp: timeStart,
                name: href,
                duration: null,
                annotations: [{
                    endpoint: agent.getServiceInformation(),
                    value: 'cs',
                    timestamp: timeStart
                }]
            });

            function addSession() {
                transactionHelper.setTraceId(traceId);
                transactionHelper.setRequestId(spanId);
                return orig.apply(this, arguments);

            }

            requestOptions.headers = requestOptions.headers || {};

            requestOptions.headers['X-B3-TraceId'] = traceId;
            requestOptions.headers['X-B3-SpanId'] = spanId;
            // current spanId will be parentId // TODO sure?
            if(parentId) {
                requestOptions.headers['X-B3-ParentSpanId'] = parentId;
            }
            requestOptions.headers['X-B3-Sampled'] = true;

            arguments[0] = requestOptions;


            var req = transactionHelper.bind(addSession).apply(this, arguments);


            var name = req.method;
            console.log(req.path);

            req.on('response', function onresponse(message) {
                debugMain('CR', traceId, spanId);

                const timeEnd = agent.whatTimeIsIt();
                const timeTook = timeEnd - timeStart;

                collector.reportIncomingResponse({
                    traceId: traceId,
                    id: spanId,
                    parentId: parentId,
                    timestamp: timeStart,
                    duration: timeTook,
                    name: href,
                    annotations: [{
                        endpoint: agent.getServiceInformation(),
                        value: 'cr',
                        timestamp: timeEnd
                    }]
                });

                message.statusMessage
                message.statusCode

            });

            req.on('error', function onerror(err) {
                debugMain('CR', 'error', err);
            });

            req.on('end', function reqEnd() {
                debugger;
            })

            return req;

        };
    });


    shimmer.wrap(http.Server.prototype, 'on', function (original) {
        console.log('shimming http.Server.on');
        return function (event, listener) {

            if (arguments[0] === 'request' && typeof arguments[1] === 'function') {

                arguments[1] = onRequest;

                return original.apply(this, arguments);
            }


            function onRequest(request, response) {

                // #1

                let timeStart = agent.whatTimeIsIt();

                let url = request.url.split('?');
                let path = url[0];
                let queryParams = url[1];

                if(BLACKLIST_PATHS.indexOf(path) > -1) {
                    console.log('blacklisting:', path);
                    return listener.apply(this, arguments);
                }



                // See https://github.com/openzipkin/brave/blob/e474ed1e1cd291c7ebc6830c58fdba0a6318fdd2/brave-http/src/main/java/com/github/kristofa/brave/http/BraveHttpHeaders.java
                // Node's http module modifies all header keys to lower case
                let traceId = request.headers['x-b3-traceid'] || transactionHelper.generateTraceId();

                // if there is no spanId present, this is the entry point of the trace and therefore set equals traceId
                let spanId = request.headers['x-b3-spanid'] || traceId;
                let parentSpanId = request.headers['x-b3-parentspanid'];
                let sampled = request.headers['x-b3-sampled'] || true; // TODO sample rate needs to be implemented



                console.log(url, traceId, spanId, parentSpanId, sampled)

                debugMain('SR', traceId, spanId);


                collector.reportIncomingRequest({
                    traceId: traceId,
                    id: spanId,
                    parentId: parentSpanId,
                    timestamp: timeStart,
                    name: path,
                    duration: null,
                    annotations: [{
                        endpoint: agent.getServiceInformation(),
                        value: 'sr',
                        timestamp: timeStart
                    }]
                });


                let originalWriteHead = response.writeHead;

                response.writeHead = function writeHead(statusCode, reason, headers) {

                    // #2

                    // console.log('writeHead:', statusCode, reason, headers);


                    response.setHeader('X-B3-TraceId', traceId);
                    response.setHeader('X-B3-SpanId', spanId);
                    // current spanId will be parentId // TODO sure?
                    if(parentSpanId) {
                        response.setHeader('X-B3-ParentSpanId', parentSpanId);
                    }
                    response.setHeader('X-B3-Sampled', sampled);

                    return originalWriteHead.apply(response, arguments)
                };

                response.once('finish', function finish() {

                    // #3

                    let timeEnd = agent.whatTimeIsIt();
                    let timeTook = timeEnd - timeStart;

                    debugMain('SS', traceId, spanId);
                    collector.reportOutgoingResponse({
                        traceId: traceId,
                        id: spanId,
                        name: path,
                        timestamp: timeStart,
                        duration: timeTook,
                        annotations: [{
                            endpoint: agent.getServiceInformation(),
                            value: 'ss',
                            timestamp: timeEnd
                        }]
                        // hasError: !!arguments[0],
                        // meta_infomation: arguments[0] || arguments[1]
                    });

                });

                function addSession() {
                    transactionHelper.setTraceId(traceId);
                    transactionHelper.setRequestId(spanId);
                    return listener.apply(this, arguments)
                }

                return transactionHelper.bind(addSession).apply(this, arguments);
            }


            // console.log('original called', arguments);
            return original.apply(this, arguments);


        }
    });


    return http;
};
