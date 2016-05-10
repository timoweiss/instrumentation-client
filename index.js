'use strict';


const cls = require('continuation-local-storage');
const uuid = require('node-uuid');

const collector = require('./lib/collector');
const reporter = require('./lib/reporter');
const Agent = require('./lib/agent');

const defaultConfig = {};


module.exports.start = function start(config) {
    console.log('starting instrumentations');

    config = Object.assign(config, defaultConfig);

    const agent = new Agent(config);
    const namespace = cls.createNamespace('TODO');

    config.collector = collector;
    config.agent = agent;
    config.reporter = reporter;

    config.namespaceFns = {
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
    config.namespace = namespace;


    require('./lib/instrumentations/senecaShim').start(config);
};
