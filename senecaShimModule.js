'use strict';

var shimmer = require('shimmer');
const util = require('util');
const uuid = require('node-uuid');


module.exports = function (senecaInstance, collector) {
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
                // overrid original request handler
                arguments[1] = function (args, callback) {
                    // someone wants us to act
                    const doReport = !!(args.____transactionId && args.transport$)
                    console.log('new incomming request', 'reporting?', doReport);

                    if (doReport) {

                        let incommingTransactionId = args.____transactionId;

                        const collectorObject = {};
                        collectorObject[incommingTransactionId] = args;

                        collector.reportIncommingRequest(collectorObject);

                        let originalCallback = callback;
                        arguments[1] = function (err, data) {
                            if (!err && data) {
                                data.____transactionId = incommingTransactionId;
                                console.log('intercepting outgoing response', arguments);
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


            if (arguments[0].____transactionId) {
                console.log('____transactionId is available, patching nothing')
                return original.apply(this, arguments);
            }

            // client calls act, create transactionId for this transaction
            let transactionId = makeid();

            console.log('creating transaction:', transactionId);
            // console.log('act was called', '#1', arguments, transactionId);
            let objectToModify = {};
            let fnToPatch = function () {
            };
            let fnIndex;


            // async call only with pattern
            if (arguments.length === 1) {

                console.log('act call:', 'async call only with pattern');

                if (typeof arguments[0] === 'object') {
                    objectToModify = arguments[0];
                } else if (typeof arguments[0] === 'string') {
                    console.log('uff, TODO, add data to string')
                }
            }

            // async call with pattern and data
            if (arguments.length === 2 && typeof arguments[1] === 'object') {

                console.log('act call:', 'async call with pattern and data');

                objectToModify = arguments[1];
            }

            // sync call with pattern and callback (most likely)
            if (arguments.length === 2 && typeof arguments[1] === 'function') {

                console.log('act call:', 'sync call with pattern and callback (likely)');

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

                console.log('act call:', 'sync call with pattern, data and callback');

                objectToModify = arguments[1];
                fnToPatch = arguments[2];
                fnIndex = 2;
            }


            if (objectToModify.____transactionId) {
                console.log('incomming transaction', objectToModify.____transactionId)
            } else {

                objectToModify.____transactionId = transactionId
            }

            const collectorObject = {};
            collectorObject[transactionId] = objectToModify;

            collector.reportOutgoingRequest(collectorObject);


            // only if sync
            if (fnIndex !== void 0) {
                arguments[fnIndex] = function () {
                    // this will be called whenever a result is available
                    console.log('sync result available:', arguments);
                    if (arguments[0] === null && arguments[1] && arguments[1].____transactionId) {
                        let responseTRID = arguments[1].____transactionId;
                        const collectorObject = {};
                        collectorObject[responseTRID] = arguments[2];
                        collector.reportIncommingResponse(collectorObject);
                        // cleanup
                        delete arguments[1].____transactionId;
                    }


                    return fnToPatch.apply(this, arguments);
                };
            }

            return original.apply(this, arguments);
        }
    });


    senecaInstance.ready(function () {
        console.log('initializing done')


    });

    return senecaInstance;
};

function makeid() {
    return uuid.v4();
}