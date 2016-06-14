'use strict';
var hook = require('require-in-the-middle');

module.exports.start = function(opts) {


    // TODO: handle on exit, send remaining data + closing msg sync to server

    // TODO debugging only
    process.title = opts.service_name;

    const agent = opts.agent;
    const collector = opts.collector;

    const namespaceFns = opts.namespaceFns;

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


    // hook('seneca', function (exports, name, basedir) {
    //     console.log('shimming', name, basedir);
    //     var _exports = exports;
    //
    //     exports = function patchedSeneca() {
    //         console.log('seneca was instantiated');
    //         let senecaInstance = _exports.apply(this, arguments);
    //         senecaInstance.ready(function() {
    //             collector.flush();
    //         });
    //
    //         require('./senecaShimModule')(senecaInstance, agent, collector, namespaceFns);
    //
    //         return senecaInstance;
    //     };
    //     return exports;
    // })
};
