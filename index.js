'use strict';


const cls = require('continuation-local-storage');

const collector = require('./lib/collector');
const reporter = require('./lib/reporter');
const Agent = require('./lib/agent');

const osMetrics = require('./lib/metrics/osMetrics');

const defaultConfig = require('./lib/util/defaultConfig');


module.exports.start = function start(config) {
    config = Object.assign(defaultConfig, config);

    if(config.todo_disabled) {
        return console.log('Todo disabled, have a nice day');
    }
    console.log('starting instrumentations');



    if(!config || !config.app_token) {
        throw new Error('please provide an app_token, you can get one from: https://TODO.io');
    }

    console.log('config', config)
    const osm = osMetrics(config);

    const namespace = cls.createNamespace('TODO');

    config.collector = collector;
    config.osm = osm;
    config.reporter = reporter(config);

    config.reporter.sendStartUpInfo();

    process.on('exit', () => config.reporter.report(true));

    const agent = Agent(config);


    const libraryType = {};
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
        generateTraceId: makeid,
        generateRequestId: makeid,
        bind: function(fn) {
            return namespace.bind(fn)
        },
        libraryType: libraryType
    };
    config.namespace = namespace;

    config.agent = agent;

    require('./lib/instrumentations').start(config);
};


// this is borrowed from:
// https://github.com/openzipkin/zipkin-js/blob/master/packages/zipkin/src/tracer/randomTraceId.js
function makeid() {
    const digits = '0123456789abcdef';
    const dLength = digits.length;
    let n = digits[Math.floor(Math.random() * (dLength - 1)) + 1];
    for (let i = 0; i < 15; i++) {
        const rand = Math.floor(Math.random() * dLength);
        n += digits[rand];
    }
    // console.log('length of id:', n.length);
    return n;
}