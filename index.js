'use strict';


const collector = require('./lib/collector');
const Agent = require('./lib/agent');


module.exports.start = function start(options) {
    console.log('starting instrumentations');

    const agent = new Agent(options);

    options.collector = collector;
    options.agent = collector;


    require('./senecaShim').start(options);
};