'use strict';


const collector = require('./collector')();
const Agent = require('./agent');


module.exports.start = function start(options) {
    console.log('starting instrumentations');

    require('./senecaShim').start(options);
};