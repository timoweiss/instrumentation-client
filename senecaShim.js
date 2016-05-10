'use strict';
var hook = require('require-in-the-middle')
var eventLoopStats = require('event-loop-stats');
const uuid = require('node-uuid');


const cls = require('continuation-local-storage');


const collector = require('./collector');
const Agent = require('./agent');
const reporter = require('./reporter');


module.exports.start = function(opts) {
    //console.log('lets create some hooks', opts);


    // TODO: handle on exit, send remaining data + closing msg sync to server
    // TODO: send welcome message to server
    // TODO: send ping to server?

    // TODO debugging only
    process.title = opts.service_name;

    const agent = new Agent(opts);

    const namespace = cls.createNamespace('test');

    const namespaceFns = {
        setTraceId: function(tid) {
            return namespace.set('tid', tid);
        },
        getTraceId: function() {
            return namespace.get('tid');
        },
        setRequestId: function(tid) {
            return namespace.set('rid', tid);
        },
        getRequestId: function() {
            return namespace.get('rid');
        },
        generateTraceId: function makeid() {
            return uuid.v4();
        },
        generateRequestId: function makeid() {
            return uuid.v4();
        },
        bind: function(fn) {
            return namespace.bind(fn)
        }
    };


    hook('seneca', function (exports, name, basedir) {
        console.log('shimming', name, basedir);
        var _exports = exports;

        exports = function patchedSeneca() {
            console.log('seneca was instantiated');
            let senecaInstance = _exports.apply(this, arguments);
            senecaInstance.ready(function() {
                collector.flush();
            });
            reporter(opts, collector);

            require('./senecaShimModule')(senecaInstance, agent, collector, namespaceFns)
            
            return senecaInstance;
        };
        return exports;
        
        // return require('./senecaShimModule')(exports, 'asd', 'asd')
    })
};
