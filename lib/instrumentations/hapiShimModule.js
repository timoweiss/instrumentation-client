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
            if (this.ext && typeof this.ext === 'function') {

                this.ext('onPreAuth', (request, reply) => {

                    let id = transactionHelper.getRequestId();
                    if(id) {
                        collector.setPreferredNameForIncomingRequest(id, request.route.path || request.route.settings.fingerprint)
                        console.log('id was present, all good', id);
                    }
                    reply.continue();
                });

            }

            return orig.apply(this, arguments)
        };

    });


    return hapi;
};
