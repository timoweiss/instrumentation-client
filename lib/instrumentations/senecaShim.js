'use strict';
var hook = require('require-in-the-middle')
var eventLoopStats = require('event-loop-stats');
const uuid = require('node-uuid');


module.exports.start = function(opts) {
    //console.log('lets create some hooks', opts);


    // TODO: handle on exit, send remaining data + closing msg sync to server
    // TODO: send welcome message to server
    // TODO: send ping to server?

    // TODO debugging only
    process.title = opts.service_name;

    const agent = opts.agent;
    const collector = opts.collector;

    const namespaceFns = opts.namespaceFns;




    hook('seneca', function (exports, name, basedir) {
        console.log('shimming', name, basedir);
        var _exports = exports;

        exports = function patchedSeneca() {
            console.log('seneca was instantiated');
            let senecaInstance = _exports.apply(this, arguments);
            senecaInstance.ready(function() {
                collector.flush();
            });

            require('./senecaShimModule')(senecaInstance, agent, collector, namespaceFns);
            
            return senecaInstance;
        };
        return exports;
        
        // return require('./senecaShimModule')(exports, 'asd', 'asd')
    })
};
