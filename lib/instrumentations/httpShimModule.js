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

            if(hostname === '52.58.50.119') {
                // debugMain('rejecting own host');
                return orig.apply(this, arguments);
            } else {
                // debugMain('not rejecting outgoing request')
            }
            const timeStart = agent.whatTimeIsIt();
            const id = transactionHelper.generateRequestId();
            let traceId = transactionHelper.getTraceId();
            
            if(!traceId) {
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

            if(arguments[0] === 'request' && typeof arguments[1] === 'function') {

                arguments[1] = onRequest;

                return original.apply(this, arguments);
            }


            function onRequest (request, response) {

                let timeStart = agent.whatTimeIsIt();


                let traceId = request.headers['X-B3-TraceId'] || transactionHelper.generateTraceId();
                let spanId = request.headers['X-B3-SpanId'] || traceId;
                let parentSpanId = request.headers['X-B3-ParentSpanId'];
                let sampled = request.headers['X-B3-Sampled'] || true; // TODO sample rate needs to be implemented


                let url = request.url.split('?');
                let path = url[0];
                let queryParams = url[1];

                debugMain('SR', timeStart, request.headers);



                response.setHeader('X-Quatsch', 'blabla');


                // var trans = agent.startTransaction(null, 'web.http')
                // trans.req = req

                let trans = {}

                response.once('finish', function finish() {

                    debugMain('SS', timeStart);

                });


                let originalWriteHead = response.writeHead;

                response.writeHead = function writeHead(statusCode, reason, headers) {
                    console.log('writeHead:', statusCode, reason, headers);

                    return originalWriteHead.apply(response, arguments)
                };

                return listener.apply(this, arguments)
            }


            // console.log('original called', arguments);
            return original.apply(this, arguments);


        }
    });


    return http;
};
