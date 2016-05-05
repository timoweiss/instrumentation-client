'use strict';

var shimmer = require('shimmer');
const util = require('util');

const jsonic = require('jsonic');

let lastSeen = {};

function isMyOwnCall(args, lastSeen) {
    for (var key in lastSeen) {
        if (!args.hasOwnProperty(key) || args[key] !== lastSeen[key]) {
            return false;
        }
    }
    return true;

}
let FNNAME_BLACKLIST = ['transport_client', 'hook_client', 'add_client', 'plugin_definition', 'web_use', 'push'];

module.exports = function (senecaInstance, agent, collector, transactionStuff) {
    console.log('wrapping senecaInstance');
    shimmer.wrap(senecaInstance, 'add', function (original) {
        console.log('shimming seneca.add');
        return function () {

            // console.log('seneca add called', arguments[0])

            const args = Array.prototype.slice.apply(arguments);

            const origCallbackFn = args.pop();

            args[0] = jsonic(args[0]);
            const pattern = args[0];
            if(patternMatchedSenecaNative(pattern)) {
                console.log('filtering pattern:', cyanBg(JSON.stringify(pattern)));
            } else {

                console.log('adding pattern:', red2(JSON.stringify(pattern)));
            }

            return original.apply(this, arguments);





            // check for handler cb
            if (typeof arguments[1] === 'function') {
                // preserve original request handler
                let originalHandler = arguments[1];
                // override original request handler
                arguments[1] = function (args, callback) {

                    if(args.___process_id && args.___process_id.length <= 1) {
                        console.log(red2('reject due'))
                        return originalHandler.apply(this, arguments);

                    }


                    if (args && (args.config || args.type === 'web' || args.type === 'balance')) {
                        return originalHandler.apply(this, arguments);
                    }

                    // TODO: refactor this
                    if (FNNAME_BLACKLIST.indexOf(originalHandler.name) !== -1 || isMyOwnCall(arguments[0], lastSeen) || (arguments[0].transport && lastSeen.transport && arguments[0].transport.origin === lastSeen.transport.origin)) {
                        console.log(cyan('rejecting this. I dont want to handle this act: ' + JSON.stringify(arguments[0])), process.pid);
                        return originalHandler.apply(this, arguments);
                    } else {
                        console.log(cyan('NOT rejecting this. I want to handle this act: ' + JSON.stringify(arguments[0])), process.pid);

                    }

                    console.log();
                    console.log();
                    console.log(red2('incomming request: ' + JSON.stringify(args)))
                    console.log();
                    console.log();


                    // someone wants us to act
                    // console.log('someone wants us to act, und dabei kommt an:', args);
                    const doReport = !!(args.____transactionId && args.transport$)
                    // console.log('new incomming request', 'reporting?', doReport, args.____transactionId, transactionStuff.getTransactionId());

                    if (doReport) {

                        let incommingTransactionId = args.____transactionId;

                        transactionStuff.setTransactionId(incommingTransactionId);

                        const collectorObject = {};
                        collectorObject[incommingTransactionId] = args;

                        collector.reportIncommingRequest(collectorObject);

                        let originalCallback = callback;
                        arguments[1] = function (err, data) {
                            if (!err && data) {
                                data.____transactionId = incommingTransactionId;
                                // console.log('intercepting outgoing response', arguments);
                                let outGoingResp = {};
                                outGoingResp[incommingTransactionId] = data;
                                collector.reportOutgoingResponse(outGoingResp);

                            }
                            return originalCallback.apply(this, arguments);
                        }

                    }

                    // call original implementation
                    return originalHandler.apply(this, arguments);
                }
            }

            // if(typeof arguments[0] === 'string') {
            //     str = arguments[0];
            // } else {
            //     str = arguments[0].role || arguments[0].init || '';
            // }
            // let isFromSeneca = str.includes('web') || str.includes('transport')  || str.includes('basic') || str.includes('util') || str.includes('entity') || str.includes('seneca') || str.includes('mem-store');
            // if (!isFromSeneca) {
            //     // console.log('something other:', arguments)
            // }
            return original.apply(this, arguments);
        }
    });
    //
    shimmer.wrap(senecaInstance, 'act', function (original) {
        console.log('shimming seneca.act');

        return function (/*pattern, [[data], [callback]]*/) {

            const args = Array.prototype.slice.apply(arguments);

            args[0] = jsonic(args[0]);
            const origCallbackFn = args.pop();
            const pattern = args[0];

            let transaction_id;

            if(patternMatchedSenecaNative(pattern)) {
                return original.apply(this, arguments);
            }


            if(typeof origCallbackFn !== 'function') {
                console.log(red2('TODO:'), 'no callback supplied (async)');
                return original.apply(this, arguments);
            }


            console.log();
            console.log();
            console.log(red2('[patched act]: setting last seen object'));
            lastSeen = arguments[0];
            console.log();
            console.log();


            // get and set tracing data

            if(pattern && pattern.__$$tracing_data) {
                console.log('tracing data already exists', pattern.__$$tracing_data);
                transaction_id = pattern.__$$tracing_data.transaction_id;
                // TODO: remove, only testing
                if(!transaction_id) throw new Error('missing transaction_id');

            } else {
                // this act call is new, decorate with tracing data
                pattern.__$$tracing_data = {};
                pattern.__$$tracing_data.initiator = agent.getServiceInformation();

                transaction_id = transactionStuff.getTransactionId();

                if(!transaction_id) {
                    transaction_id = transactionStuff.generateTransactionId();
                }
                pattern.__$$tracing_data.transaction_id = transaction_id;
                console.log(red2('transaction_id set:'), transaction_id);
            }

            const collectorObject = {};
            collectorObject[transaction_id] = pattern;
            collector.reportOutgoingRequest(collectorObject);


            // only if sync
            if (origCallbackFn !== void 0) {

                args.push(function patchendCallback() {

                    console.log()
                    console.log()
                    console.log(red('process is receiving response ' + JSON.stringify(arguments)));
                    console.log()
                    console.log()


                    // this will be called whenever a result is available
                    //console.log('sync result available:', arguments);
                    // if (wasOutgoing && arguments[0] === null && arguments[1] && arguments[1].____transactionId) {
                    //
                    //     let responseTRID = arguments[1].____transactionId;
                    //     // console.log('verrrriiiiii \t', transactionStuff.getTransactionId())
                    //     // console.log('verrrriiiiii \t', responseTRID)
                    //     const collectorObject = {};
                    //     collectorObject[transactionStuff.getTransactionId() + ''] = arguments[2];
                    //     collector.reportIncommingResponse(collectorObject);
                    //     // cleanup
                    //     delete arguments[1].____transactionId;
                    // } else {
                    //     // console.log('sync result not reportable, something local');
                    // }


                    return origCallbackFn.apply(this, arguments);
                });
            }

            function addSession() {
                transactionStuff.setTransactionId(transaction_id)
                return original.apply(this, arguments)
            }

            return transactionStuff.bind(addSession).apply(this, args);
        }
    });


    senecaInstance.ready(function () {
        console.log('initializing done')


    });

    return senecaInstance;
};


function patternMatchedSenecaNative(pattern) {
    if(pattern && pattern.local$) {
        console.log('returning due local$');
        return true;
    }

    if(pattern && pattern.deprecate$) {
        console.log('returning due deprecate$');
        return true;
    }

    if(pattern && (pattern.role === 'seneca' || pattern.role === 'basic' || pattern.role === 'transport' || pattern.role === 'web' || pattern.role === 'util' || pattern.role === 'entity' || pattern.role === 'mem-store')) {
        console.log('returning due role seneca, basic, transport, web, util, entity, mem-store');
        return true;
    }

    if(pattern && pattern.init) {
        console.log('returning due init property');
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







// let objectToModify = {};
// let fnToPatch = function () {
// };
// let fnIndex;
//
//
// // async call only with pattern
// if (arguments.length === 1) {
//
//     // console.log('act call:', 'async call only with pattern');
//
//     if (typeof arguments[0] === 'object') {
//         objectToModify = arguments[0];
//     } else if (typeof arguments[0] === 'string') {
//         // console.log('uff, TODO, add data to string')
//     }
// }
//
// // async call with pattern and data
// if (arguments.length === 2 && typeof arguments[1] === 'object') {
//
//     // console.log('act call:', 'async call with pattern and data');
//
//     objectToModify = arguments[1];
// }
//
// // sync call with pattern and callback (most likely)
// if (arguments.length === 2 && typeof arguments[1] === 'function') {
//
//     // console.log('act call:', 'sync call with pattern and callback (likely)');
//
//     fnToPatch = arguments[1];
//     fnIndex = 1;
//
//
//     if (typeof arguments[0] === 'object') {
//         objectToModify = arguments[0];
//     } else if (typeof arguments[0] === 'string') {
//         console.log('uff, TODO, add data to string')
//     }
// }
//
// // sync call with pattern, data and callback
// if (arguments.length === 3 && typeof arguments[1] === 'object' && typeof arguments[2] === 'function') {
//
//     // console.log('act call:', 'sync call with pattern, data and callback');
//
//     objectToModify = arguments[1];
//     fnToPatch = arguments[2];
//     fnIndex = 2;
// }