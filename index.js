'use strict';


const cls = require('continuation-local-storage');

const collector = require('./lib/collector');
const Agent = require('./lib/agent');


module.exports.start = function start(options) {
    console.log('starting instrumentations');

    const agent = new Agent(options);


    options.collector = collector;
    options.agent = collector;
    options.namespaceFns = namespaceFns;
    options.namespace = cls.createNamespace('TODO');


    require('./senecaShim').start(options);
};

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