'use strict';

var shimmer = require('shimmer');
const util = require('util');
const dbug = require('debug');
const debugMain = dbug('main');
const debugRxReq = dbug('receiving-request');
const debugTxRes = dbug('sending-response');
const debugTxReq = dbug('sending-request');
const debugRxRes = dbug('receiving-response');


module.exports = function (http, agent, collector, transactionHelper) {
    debugMain('wrapping httpInstance');


    shimmer.wrap(http, 'request', function (orig, name) {
        return function () {

            // client send

            const requestOptions = arguments[0];

            let hostname = typeof requestOptions === 'string' ? requestOptions : requestOptions.hostname;
            console.log('hostname for request is', hostname);

            if (hostname === '52.58.50.119') {
                // debugMain('rejecting own host');
                return orig.apply(this, arguments);
            } else {
                // debugMain('not rejecting outgoing request')
            }
            const timeStart = agent.whatTimeIsIt();
            const id = transactionHelper.generateRequestId();
            let traceId = transactionHelper.getTraceId();

            if (!traceId) {
                debugMain('looks like there is no traceid available, setting');
                traceId = id;
            }

            debugMain('CS', id);

            function addSession() {
                transactionHelper.setTraceId(traceId);
                return orig.apply(this, arguments);

            }

            debugger

            var req = transactionHelper.bind(addSession).apply(this, arguments);


            var name = req.method;
            console.log(req.path);

            req.on('response', function onresponse(message) {
                debugMain('CR', message.url);

                message.statusMessage
                message.statusCode

                message.on('end', function end() {
                    debugMain('CRasdasdsad', id);
                });
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


                let traceId = request.headers['X-B3-TraceId'] || transactionHelper.generateTraceId();

                // See https://github.com/openzipkin/brave/blob/e474ed1e1cd291c7ebc6830c58fdba0a6318fdd2/brave-http/src/main/java/com/github/kristofa/brave/http/BraveHttpHeaders.java
                // if there is no spanId present, this is the entry point of the trace and therefore set equals traceId
                let spanId = request.headers['X-B3-SpanId'] || traceId;
                let parentSpanId = request.headers['X-B3-ParentSpanId'];
                let sampled = request.headers['X-B3-Sampled'] || true; // TODO sample rate needs to be implemented

                let url = request.url.split('?');
                let path = url[0];
                let queryParams = url[1];

                console.log(url, traceId, spanId, parentSpanId, sampled)

                debugMain('SR', timeStart, request.headers);

                let originalWriteHead = response.writeHead;

                response.writeHead = function writeHead(statusCode, reason, headers) {

                    // #2

                    console.log('writeHead:', statusCode, reason, headers);


                    response.setHeader('X-B3-TraceId', traceId);
                    response.setHeader('X-B3-SpanId', spanId);
                    // current spanId will be parentId // TODO sure?
                    response.setHeader('X-B3-ParentSpanId', spanId);
                    response.setHeader('X-B3-Sampled', sampled);

                    return originalWriteHead.apply(response, arguments)
                };

                response.once('finish', function finish() {

                    // #3

                    let timeEnd = agent.whatTimeIsIt();
                    let timeTook = timeEnd - timeStart;

                    debugMain('SS', timeStart, timeEnd, timeTook);

                });

                return listener.apply(this, arguments)
            }


            // console.log('original called', arguments);
            return original.apply(this, arguments);


        }
    });


    return http;
};
