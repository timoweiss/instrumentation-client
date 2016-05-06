'use strict';

var shimmer = require('shimmer');
const util = require('util');
const debug = require('debug');
const debugMain = debug('main');
const debugRxReq = debug('receiving-request');
const debugTxRes = debug('sending-response');
const debugTxReq = debug('sending-request');
const debugRxRes = debug('receiving-response');


const jsonic = require('jsonic');

module.exports = function (senecaInstance, agent, collector, transactionStuff) {
    debugMain('wrapping senecaInstance');

    // shimming add call
    // callback of add is the request handler
    // the callback of the request handler is the response-fn
    shimmer.wrap(senecaInstance, 'add', function (original) {
        debugMain('shimming seneca.add');
        return function () {

            const args = Array.prototype.slice.apply(arguments);

            let pluginDefinition = args.pop();
            let origCallbackFn;

            if(typeof pluginDefinition === 'function') {
                origCallbackFn = pluginDefinition;
                pluginDefinition = void 0;
            } else {
                origCallbackFn = args.pop();
            }

            args[0] = jsonic(args[0]);

            const pattern = args[0];


            if(patternMatchedSenecaNative(pattern)) {
                debugMain('rejecting pattern, dont install interceptors');
                return original.apply(this, arguments);
            } else {
                debugMain('patching pattern, install interceptors', pattern);
            }


            if(!origCallbackFn) throw new Error('no nix da callback');


            function wrappedHandler(request, callback) {

                let transaction_id;
                let incommingTracingData;

                debugRxReq('[incomming request]:', request);

                if(request.__tracing_data) {
                    debugRxReq('tracing data available for incomming request, setting transaction_id for context', request.__tracing_data.transaction_id);
                    //request.__tracing_data.
                    transaction_id = request.__tracing_data.transaction_id;
                    incommingTracingData = request.__tracing_data;
                    delete request.__tracing_data;
                } else {
                    debugRxReq('generating new transactionId');
                    transaction_id = transactionStuff.generateTransactionId();
                }

                let origCb = arguments[arguments.length - 1];

                // function the user calls to emit the result
                arguments[arguments.length - 1] = function responseCallback(err, data) {

                    if(!err && data) {
                        debugTxRes(red2('decorate response'), incommingTracingData);
                        arguments[1].__tracing_data = incommingTracingData; //transactionStuff.getTransactionId();
                    }

                    // TODO: report outgoing response
                    collector.reportOutgoingResponse(arguments[1]);

                    return origCb.apply(this, arguments);
                };

                function addSession() {
                    transactionStuff.setTransactionId(transaction_id);
                    return origCallbackFn.apply(this, arguments)

                }

                // TODO: report incomming request
                collector.reportIncommingRequest(incommingTracingData);


                return transactionStuff.bind(addSession).apply(this, arguments);


            }

            // reassemble arguments object
            args.push(wrappedHandler);

            if(pluginDefinition) {
                args.push(pluginDefinition);
            }



            return original.apply(this, args);



        }
    });


    // shimming act function (act call => request)
    shimmer.wrap(senecaInstance, 'act', function (original) {
        debugMain('shimming seneca.act');

        return function (/*pattern, [[data], [callback]]*/) {

            //debugTxReq(red2('is there already a transaction:'), transactionStuff.getTransactionId());

            const args = Array.prototype.slice.apply(arguments);

            args[0] = jsonic(args[0]);
            const origCallbackFn = args.pop();
            let dataPattern = {};
            if(arguments.length === 3) {
                dataPattern = args.pop();
            }
            const pattern = args[0];

            let transaction_id;

            if(patternMatchedSenecaNative(pattern)) {
                return original.apply(this, arguments);
            }


            if(typeof origCallbackFn !== 'function') {
                debugTxReq(red2('TODO:'), 'no callback supplied (async)');
                return original.apply(this, arguments);
            }

            if(pattern.transport$) {
                debugTxReq(red2('TODO:'), 'is dat safe? i\'m ignoring an act call because of it\'s transport$ prop', JSON.stringify(arguments));
                // return original.apply(this, arguments);
            }

            // get and set tracing data

            if(pattern && pattern.__tracing_data) {
                debugTxReq('tracing data already exists', pattern.__tracing_data);
                transaction_id = pattern.__tracing_data.transaction_id;
                // TODO: remove, only testing
                if(!transaction_id) throw new Error('missing transaction_id');

            } else {
                // this act call is new, decorate with tracing data
                dataPattern.__tracing_data = {};
                dataPattern.__tracing_data.initiator = agent.getServiceInformation();

                transaction_id = transactionStuff.getTransactionId();

                if(!transaction_id) {
                    debugTxReq('generating new transaction id')
                    transaction_id = transactionStuff.generateTransactionId();
                }
                dataPattern.__tracing_data.transaction_id = transaction_id;
                debugTxReq(red2('transaction_id set:'), transaction_id);
            }

            const collectorObject = {};
            collectorObject[transaction_id] = dataPattern;
            collector.reportOutgoingRequest(collectorObject);


            args[0] = pattern;
            args[1] = dataPattern;

            // only if sync
            if (origCallbackFn !== void 0) {

                args.push(function patchendCallback() {

                    console.log()
                    console.log()
                    debugRxRes(red('process is receiving response ' + JSON.stringify(arguments)));
                    console.log()
                    console.log()

                    const collectorObject = {};
                    // TODO: there is a object with meta info in arguments[2]
                    collectorObject[transactionStuff.getTransactionId() + ''] = arguments[1];
                    collector.reportIncommingResponse(collectorObject);


                    return origCallbackFn.apply(this, arguments);
                });
            }

            function addSession() {
                transactionStuff.setTransactionId(transaction_id);
                return original.apply(this, arguments);

            }
            return transactionStuff.bind(addSession).apply(this, args);
        }
    });


    senecaInstance.ready(function () {
        debugMain('initializing done')


    });

    return senecaInstance;
};


function patternMatchedSenecaNative(pattern) {
    if(!pattern) {
        return false;
    }
    if(pattern.local$) {
        debugMain('returning due local$');
        return true;
    }

    if(pattern.client$) {
        debugMain('returning due client$');
        return true;
    }

    if(pattern.deprecate$) {
        debugMain('returning due deprecate$');
        return true;
    }

    if(pattern.transport$) {
        debugMain('returning due transport$');
        return true;
    }

    // TODO: mesh and all the others ;)
    if(pattern.role === 'seneca' || pattern.role === 'basic' || pattern.role === 'transport' || pattern.role === 'web' || pattern.role === 'util' || pattern.role === 'entity' || pattern.role === 'mem-store') {
        debugMain('returning due role seneca, basic, transport, web, util, entity, mem-store');
        return true;
    }

    if(pattern.init) {
        debugMain('returning due init property');
        return true;
    }
    return false;
}


function red(text) {
    return '\x1b[31m' + text + '\x1b[0m';
}
function red2(text) {
    return '\x1b[41m' + text + '\x1b[0m';
}
function cyan(text) {
    return '\x1b[36m' + text + '\x1b[0m';
}
function cyanBg(text) {
    return '\x1b[46m\x1b[1;30m' + text + '\x1b[0m';
}
