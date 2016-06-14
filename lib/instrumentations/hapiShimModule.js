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
                this.ext('onPreStart', (s, n) => {
                    console.log('onPreStart');
                    n();
                });
                this.ext('onPostStart', (s, n) => {
                    console.log('onPostStart');
                    n();
                });
                this.ext('onPreStop', (s, n) => {
                    console.log('onPreStop');
                    n();
                });
                this.ext('onPostStop', (s, n) => {
                    console.log('onPostStop');
                    n();
                });

            }

            return orig.apply(this, arguments)
        };

    });


    return hapi;
};
