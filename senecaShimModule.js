'use strict';

var shimmer = require('shimmer');
const util = require('util');

const collector = require('./collector');

module.exports = function (senecaInstance, a, b) {
    console.log('wrapping senecaInstance');
    shimmer.wrap(senecaInstance, 'add', function(original) {
        console.log('shimming seneca.add');
        return function() {
            let str = '';
            // console.log('seneca add called', arguments[0])


            // check for handler cb
            if(typeof arguments[1] === 'function') {
                // preserve original request handler
                let originalHandler = arguments[1];
                // overrid original request handler
                arguments[1] = function(args, callback) {
                    // someone wants us to act
                    const doReport = !!(args.____transactionId && args.transport$)
                    console.log('new incomming request', 'reporting?', doReport);

                    if(doReport) {

                        const collectorObject = {};
                        collectorObject[args.____transactionId] = args;

                        collector.reportIncommingRequest(collectorObject);
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
    shimmer.wrap(senecaInstance, 'act', function(original) {
        console.log('shimming seneca.act');

        return function(/*pattern, [[data], [callback]]*/) {


            if(arguments[0].____transactionId) {
                return original.apply(this, arguments);
            }

            // client calls act, create transactionId for this transaction
            let transactionId = makeid();

            console.log('creating transaction:', transactionId);
            // console.log('act was called', '#1', arguments, transactionId);
            let objectToModify = {};
            let fnToPatch = function() {};
            let fnIndex;


            // async call only with pattern
            if(arguments.length === 1) {

                console.log('act call:', 'async call only with pattern');

                if(typeof arguments[0] === 'object') {
                    objectToModify = arguments[0];
                } else if(typeof arguments[0] === 'string') {
                    console.log('uff, TODO, add data to string')
                }
            }

            // async call with pattern and data
            if(arguments.length === 2 && typeof arguments[1] === 'object') {

                console.log('act call:', 'async call with pattern and data');

                objectToModify = arguments[1];
            }

            // sync call with pattern and callback (most likely)
            if(arguments.length === 2 && typeof arguments[1] === 'function') {

                console.log('act call:', 'sync call with pattern and callback (likely)');

                fnToPatch = arguments[1];
                fnIndex = 1;


                if(typeof arguments[0] === 'object') {
                    objectToModify = arguments[0];
                } else if(typeof arguments[0] === 'string') {
                    console.log('uff, TODO, add data to string')
                }
            }

            // sync call with pattern, data and callback
            if(arguments.length === 3 && typeof arguments[1] === 'object' && typeof arguments[2] === 'function') {

                console.log('act call:', 'sync call with pattern, data and callback');

                objectToModify = arguments[1];
                fnToPatch = arguments[2];
                fnIndex = 2;
            }


            if(objectToModify.____transactionId){
                console.log('incomming transaction', objectToModify.____transactionId)
            } else {

                objectToModify.____transactionId = transactionId
            }

            const collectorObject = {};
            collectorObject[transactionId] = objectToModify;

            collector.reportOutgoingRequest(collectorObject);



            // only if sync
            if(fnIndex !== void 0) {
                arguments[fnIndex] = function() {
                    // this will be called whenever a result is available
                    console.log('result available');
                    return fnToPatch.apply(this, arguments);
                };
            }

            return original.apply(this, arguments);
        }
    });


    senecaInstance.ready(function () {
        console.log('all done')
        // console.log(senecaInstance.list())
        // setInterval(function() {
        //     senecaInstance.act('role:seneca,stats:true', function (err, stats) {
        //         console.log('stats', err || stats)
        //     });
        // }, 2000);
        let stuffIn = [];
        let stuffOut = [];
        setTimeout(function() {
            senecaInstance.on('act-in', function () {
                // console.log('act-in', arguments)
                stuffIn.push(arguments[0]);
            })
            senecaInstance.on('act-out', function () {
                // console.log('act-out', arguments)
                stuffOut.push(arguments[0]);
            })
        });
        // setTimeout(function() {
        //     let strIn = JSON.stringify(stuffIn);
        //     let strOut = JSON.stringify(stuffOut);
        //     console.log(strIn)
        //     console.log(strOut)
        // }, 10000)
    });

    return senecaInstance;
};

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}