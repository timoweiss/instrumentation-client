'use strict';

const shimmer = require('shimmer');
const util = require('util');
const dbug = require('debug');
const debugMain = dbug('main');
const debugHapi = dbug('hapi');


module.exports = function (hapi, agent, collector, transactionHelper) {
    debugMain('wrapping HapiInstance');


    shimmer.wrap(hapi.Server.prototype, 'initialize', function (orig, name) {
        return function () {

        };
    });


    return http;
};
