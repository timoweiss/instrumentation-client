'use strict';


const cls = require('continuation-local-storage');
const uuid = require('node-uuid');

const collector = require('./lib/collector');
const reporter = require('./lib/reporter');
const Agent = require('./lib/agent');

const osMetrics = require('./lib/metrics/osMetrics');

const defaultConfig = require('./lib/util/defaultConfig');


module.exports.start = function start(config) {
    console.log('starting instrumentations');

    config = Object.assign(config, defaultConfig);


    const osm = osMetrics(config);

    // setInterval(() => {
    //     console.log(osm.flush());
    // }, 10000);

    const namespace = cls.createNamespace('TODO');

    config.collector = collector;
    config.osm = osm;
    config.reporter = reporter(config);

    const agent = Agent(config);

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

    config.agent = agent;

    require('./lib/instrumentations/senecaShim').start(config);
};
