'use strict';


const cls = require('continuation-local-storage');
const uuid = require('node-uuid');

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

    // setInterval(() => {
    //     console.log(osm.flush());
    // }, 10000);

    const namespace = cls.createNamespace('TODO');

    config.collector = collector;
    config.osm = osm;
    config.reporter = reporter(config);

    config.reporter.sendStartUpInfo();

    process.on('exit', () => config.reporter.report(true));

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

    require('./lib/instrumentations').start(config);
};
