'use strict';
var hook = require('require-in-the-middle')
var eventLoopStats = require('event-loop-stats');

const collector = require('./collector')();
const reporter = require('./reporter');

setInterval(function(){
    console.log();
}, 1000)


module.exports.start = function(opts) {
    //console.log('lets create some hooks', opts);

    hook('seneca', function (exports, name, basedir) {
        console.log('shimming', name, basedir);
        var _exports = exports;

        exports = function patchedSeneca() {
            console.log('seneca was instantiated');
            let senecaInstance = _exports.apply(this, arguments);

            reporter(opts, collector);

            require('./senecaShimModule')(senecaInstance, collector)
            
            return senecaInstance;
        };
        return exports;
        
        // return require('./senecaShimModule')(exports, 'asd', 'asd')
    })
};
