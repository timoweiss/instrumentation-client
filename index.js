'use strict';


const cls = require('continuation-local-storage');
const uuid = require('node-uuid');

const collector = require('./lib/collector');
const reporter = require('./lib/reporter');
const Agent = require('./lib/agent');


module.exports.start = function start(options) {
    console.log('starting instrumentations');

    const agent = new Agent(options);
    const namespace = cls.createNamespace('TODO');

    options.collector = collector;
    options.agent = agent;
    options.reporter = reporter;

    options.namespaceFns = {
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
    options.namespace = namespace;


    require('./lib/instrumentations/senecaShim').start(options);
};
