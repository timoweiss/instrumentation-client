'use strict';
var hook = require('require-in-the-middle');

module.exports.start = function(config) {


    // TODO: handle on exit, send remaining data + closing msg sync to server

    // TODO debugging only
    process.title = config.service_name;

    const agent = config.agent;
    const collector = config.collector;

    const namespaceFns = config.namespaceFns;

    hook(['hapi', 'http', 'seneca'], function (exports, name, basedir) {


        console.log('shimming', name, basedir);
        let _exports = exports;

        if(name === 'http') {
            require('./httpShimModule')(exports, agent, collector, namespaceFns);
        }

        if(name === 'hapi') {
            require('./hapiShimModule')(exports, agent, collector, namespaceFns);
        }

        if(name === 'seneca') {
            exports = function patchedSeneca() {
                console.log('seneca was instantiated');
                let senecaInstance = _exports.apply(this, arguments);
                senecaInstance.ready(function() {
                    collector.flush();
                });

                require('./senecaShimModule')(senecaInstance, agent, collector, namespaceFns);

                return senecaInstance;
            };
        }


        return exports;
    });
};
