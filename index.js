'use strict';


const collector = require('./collector');
const Agent = require('./agent');


module.exports.start = function start(options) {
    console.log('starting instrumentations');

    const agent = new Agent(options);

    options.collector = collector;
    options.agent = collector;


    require('./senecaShim').start(options);
};