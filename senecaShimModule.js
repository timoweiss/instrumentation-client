'use strict';

var shimmer = require('shimmer');
const util = require('util');

const _ = require('lodash');

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

module.exports = function (senecaInstance, collector, transactionStuff) {
    console.log('wrapping senecaInstance');
    shimmer.wrap(senecaInstance, 'add', function (original) {
        console.log('shimming seneca.add');
        return function () {
            let str = '';
            // console.log('seneca add called', arguments[0])


            // check for handler cb
            if (typeof arguments[1] === 'function') {
                // preserve original request handler
                let originalHandler = arguments[1];
                // override original request handler
                arguments[1] = function (args, callback) {


                    if (args && (args.config || args.type === 'web' || args.type === 'balance')) {
                        return originalHandler.apply(this, arguments);
                    }

                    // TODO: refactor this
                    if (FNNAME_BLACKLIST.indexOf(originalHandler.name) !== -1 || isMyOwnCall(arguments[0], lastSeen) || (arguments[0].transport && lastSeen.transport && arguments[0].transport.origin === lastSeen.transport.origin)) {
                        console.log(cyan('rejecting this. I dont want to handle this act: ' + JSON.stringify(arguments[0])));
                        return originalHandler.apply(this, arguments);
                    } else {
                        console.log(cyan('NOT rejecting this. I want to handle this act: ' + JSON.stringify(arguments[0])));

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



            if(arguments[0] && (arguments[0].config || arguments[0].type === 'web' || arguments[0].type === 'balance' || arguments[0] === 'role:transport,cmd:client' /*|| (typeof arguments[0] === 'string' && arguments[0].includes('role:transport'))*/)) {
                console.log('returning act')
                return original.apply(this, arguments);
            }


            console.log()
            console.log()
            console.log(red('process is calling act: ' + (arguments[0] && (arguments[0].config || arguments[0].type === 'web' || arguments[0].type === 'balance')) + JSON.stringify(arguments[0])));
            lastSeen = arguments[0];
            console.log()
            console.log()

            let objectToModify = {};
            let fnToPatch = function () {
            };
            let fnIndex;


            // async call only with pattern
            if (arguments.length === 1) {

                // console.log('act call:', 'async call only with pattern');

                if (typeof arguments[0] === 'object') {
                    objectToModify = arguments[0];
                } else if (typeof arguments[0] === 'string') {
                    // console.log('uff, TODO, add data to string')
                }
            }

            // async call with pattern and data
            if (arguments.length === 2 && typeof arguments[1] === 'object') {

                // console.log('act call:', 'async call with pattern and data');

                objectToModify = arguments[1];
            }

            // sync call with pattern and callback (most likely)
            if (arguments.length === 2 && typeof arguments[1] === 'function') {

                // console.log('act call:', 'sync call with pattern and callback (likely)');

                fnToPatch = arguments[1];
                fnIndex = 1;


                if (typeof arguments[0] === 'object') {
                    objectToModify = arguments[0];
                } else if (typeof arguments[0] === 'string') {
                    console.log('uff, TODO, add data to string')
                }
            }

            // sync call with pattern, data and callback
            if (arguments.length === 3 && typeof arguments[1] === 'object' && typeof arguments[2] === 'function') {

                // console.log('act call:', 'sync call with pattern, data and callback');

                objectToModify = arguments[1];
                fnToPatch = arguments[2];
                fnIndex = 2;
            }

            let localTid = transactionStuff.getTransactionId();
            let transactionId;
            let wasOutgoing = false;


            if (objectToModify.____transactionId || localTid) {
                transactionId = objectToModify.____transactionId || localTid;
                if (!objectToModify.____transactionId) {
                    transactionStuff.setTransactionId(transactionId);
                }
                if(localTid) {
                    wasOutgoing = true;
                    const collectorObject = {};
                    collectorObject[transactionId] = objectToModify;
                    collector.reportOutgoingRequest(collectorObject);
                }
                objectToModify.____transactionId = objectToModify.____transactionId || transactionId;
                // console.log(red2('ich würde jetzt outgoing request loggen ' + JSON.stringify(objectToModify)));

                // console.log('incomming transaction', arguments[0],transactionId)
            } else {
                transactionId = transactionStuff.generateTransactionId()

                // console.log('setting transactionid', transactionId);
                objectToModify.____transactionId = transactionId;
                // transactionStuff.setTransactionId(transactionId);

                const collectorObject = {};
                collectorObject[transactionId] = objectToModify;
                collector.reportOutgoingRequest(collectorObject);
                wasOutgoing = true;
            }


            // only if sync
            if (fnIndex !== void 0) {
                arguments[fnIndex] = function () {

                    console.log()
                    console.log()
                    console.log(red('process is receiving response ' + JSON.stringify(arguments)));
                    console.log()
                    console.log()


                    // this will be called whenever a result is available
                    //console.log('sync result available:', arguments);
                    if (wasOutgoing && arguments[0] === null && arguments[1] && arguments[1].____transactionId) {

                        let responseTRID = arguments[1].____transactionId;
                        // console.log('verrrriiiiii \t', transactionStuff.getTransactionId())
                        // console.log('verrrriiiiii \t', responseTRID)
                        const collectorObject = {};
                        collectorObject[transactionStuff.getTransactionId() + ''] = arguments[2];
                        collector.reportIncommingResponse(collectorObject);
                        // cleanup
                        delete arguments[1].____transactionId;
                    } else {
                        // console.log('sync result not reportable, something local');
                    }


                    return fnToPatch.apply(this, arguments);
                };
            }

            function addSession() {
                transactionStuff.setTransactionId(transactionId)
                return original.apply(this, arguments)
            }

            return transactionStuff.bind(addSession).apply(this, arguments);
        }
    });


    senecaInstance.ready(function () {
        console.log('initializing done')


    });

    return senecaInstance;
};


function red(text) {
    return '\x1b[31m' + text + '\x1b[0m';
}
function red2(text) {
    return '\x1b[41m' + text + '\x1b[0m';
}
function cyan(text) {
    return '\x1b[36m' + text + '\x1b[0m';
}